package dev.bera.app.model;

import jakarta.persistence.*;
import java.time.*;
import java.util.UUID;

@Entity
@Table(name = "payments")
public class Payment {

  @Id
  public UUID id = UUID.randomUUID();

  @Column(nullable = false)
  public Instant createdAt = Instant.now();

  @Column(name = "installment_id")
  public UUID installmentId = null;

  @Column(name = "amount_cents")
  public int amountCents = 0;

  @Column(name = "note", length = 300)
  public String note = "";

  @Column(name = "idempotency_key")
  public UUID idempotencyKey = null;
}
