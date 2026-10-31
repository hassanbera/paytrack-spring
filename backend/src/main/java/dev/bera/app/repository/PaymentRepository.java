package dev.bera.app.repository;

import dev.bera.app.model.Payment;
import jakarta.persistence.LockModeType;
import java.util.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

public interface PaymentRepository extends JpaRepository<Payment, UUID> {
  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select x from Payment x where x.id=:id")
  Optional<Payment> lock(@Param("id") UUID id);

  List<Payment> findByInstallmentIdOrderByCreatedAt(UUID id);
  Optional<Payment> findByIdempotencyKey(UUID key);
}
