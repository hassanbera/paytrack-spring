package dev.bera.app.model;

import jakarta.persistence.*;
import java.time.*;
import java.util.UUID;

@Entity
@Table(name = "plans")
public class Plan {

  @Id
  public UUID id = UUID.randomUUID();

  @Column(nullable = false)
  public Instant createdAt = Instant.now();

  @Column(name = "title", length = 120)
  public String title = "";

  @Column(name = "client_name", length = 100)
  public String clientName = "";

  @Column(name = "client_email", length = 200)
  public String clientEmail = "";

  @Column(name = "total_cents")
  public int totalCents = 0;
}
