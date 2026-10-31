package dev.bera.app.repository;

import dev.bera.app.model.Installment;
import jakarta.persistence.LockModeType;
import java.util.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

public interface InstallmentRepository
  extends JpaRepository<Installment, UUID>
{
  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select x from Installment x where x.id=:id")
  Optional<Installment> lock(@Param("id") UUID id);

  List<Installment> findByPlanIdOrderByNumber(UUID id);
}
