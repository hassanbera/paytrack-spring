package dev.bera.app.controller;

import com.fasterxml.jackson.databind.JsonNode;
import dev.bera.app.service.DomainService;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class ApiController {

  private final DomainService service;
  private final JdbcTemplate db;

  public ApiController(DomainService service, JdbcTemplate db) {
    this.service = service;
    this.db = db;
  }

  @GetMapping("/health")
  public Object health() {
    db.queryForObject("SELECT 1", Integer.class);
    return Map.of("data", Map.of("status", "ok"));
  }

  @GetMapping("/plans")
  public Object action0() {
    return Map.of("data", service.plans());
  }

  @PostMapping("/plans")
  public Object action1(@RequestBody JsonNode j) {
    return Map.of("data", service.createPlan(j));
  }

  @GetMapping("/plans/{id}")
  public Object action2(@PathVariable UUID id) {
    return Map.of("data", service.plan(id));
  }

  @PostMapping("/installments/{id}/payments")
  public Object action3(@PathVariable UUID id, @RequestBody JsonNode j) {
    return Map.of("data", service.pay(id, j));
  }
}
