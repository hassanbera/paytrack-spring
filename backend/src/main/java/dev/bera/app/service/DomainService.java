package dev.bera.app.service;

import static dev.bera.app.common.Input.*;

import com.fasterxml.jackson.databind.*;
import dev.bera.app.common.*;
import dev.bera.app.model.*;
import dev.bera.app.repository.*;
import java.time.*;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DomainService {

  private final PlanRepository plans;
  private final InstallmentRepository installments;
  private final PaymentRepository payments;

  public DomainService(
    PlanRepository plans,
    InstallmentRepository installments,
    PaymentRepository payments
  ) {
    this.plans = plans;
    this.installments = installments;
    this.payments = payments;
  }

  public List<Plan> plans() {
    return plans.findAll(
      org.springframework.data.domain.Sort.by("createdAt").descending()
    );
  }

  public Map<String, Object> plan(UUID id) {
    var p = found(plans.findById(id));
    return Map.of(
      "plan",
      p,
      "installments",
      installments
        .findByPlanIdOrderByNumber(id)
        .stream()
        .map(i ->
          Map.of(
            "installment",
            i,
            "payments",
            payments.findByInstallmentIdOrderByCreatedAt(i.id)
          )
        )
        .toList()
    );
  }

  @Transactional
  public Plan createPlan(JsonNode j) {
    var p = new Plan();
    p.title = text(j, "title", 120, true);
    p.clientName = text(j, "clientName", 100, true);
    p.clientEmail = email(j);
    p.totalCents = number(j, "totalCents", 1, 1000000000);
    int count = number(j, "count", 1, 60);
    if (count > p.totalCents) throw new ApiException(
      400,
      "Taksit tutarı en az bir kuruş olmalı."
    );
    var first = date(j, "firstDueDate");
    plans.save(p);
    for (int n = 0; n < count; n++) {
      var i = new Installment();
      i.planId = p.id;
      i.number = n + 1;
      i.amountCents = p.totalCents / count + (n < p.totalCents % count ? 1 : 0);
      var month = java.time.YearMonth.from(first).plusMonths(n);
      i.dueDate =
        first.getDayOfMonth() == first.lengthOfMonth()
          ? month.atEndOfMonth()
          : month.atDay(Math.min(first.getDayOfMonth(), month.lengthOfMonth()));
      installments.save(i);
    }
    return p;
  }

  @Transactional
  public Payment pay(UUID id, JsonNode j) {
    int amount = number(j, "amountCents", 1, 1000000000);
    var key = id(j, "idempotencyKey");
    String note = text(j, "note", 300, false);
    var i = found(installments.lock(id));
    var old = payments.findByIdempotencyKey(key);
    if (old.isPresent()) {
      var p = old.get();
      if (
        !p.installmentId.equals(id) ||
        p.amountCents != amount ||
        !p.note.equals(note)
      ) throw new ApiException(
        409,
        "Tekrar anahtarı farklı bir işlem için kullanılmış."
      );
      return p;
    }
    if (amount > i.amountCents - i.paidCents) throw new ApiException(
      409,
      "Tahsilat kalan bakiyeyi aşamaz."
    );
    var p = new Payment();
    p.installmentId = id;
    p.amountCents = amount;
    p.note = note;
    p.idempotencyKey = key;
    i.paidCents += amount;
    installments.save(i);
    return payments.save(p);
  }
}
