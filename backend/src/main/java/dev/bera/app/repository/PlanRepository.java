package dev.bera.app.repository;

import dev.bera.app.model.Plan;
import jakarta.persistence.LockModeType;
import java.util.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

public interface PlanRepository extends JpaRepository<Plan, UUID> {
  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select x from Plan x where x.id=:id")
  Optional<Plan> lock(@Param("id") UUID id);
}
