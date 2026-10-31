package dev.bera.app.model;

import jakarta.persistence.*;
import java.time.*;
import java.util.UUID;

@Entity
@Table(name = "installments")
public class Installment {

  @Id
  public UUID id = UUID.randomUUID();

  @Column(nullable = false)
  public Instant createdAt = Instant.now();

  @Column(name = "plan_id")
  public UUID planId = null;

  @Column(name = "number")
  public int number = 0;

  @Column(name = "amount_cents")
  public int amountCents = 0;

  @Column(name = "paid_cents")
  public int paidCents = 0;

  @Column(name = "due_date")
  public LocalDate dueDate = null;
}
