package dev.bera.app.common;

import java.util.Map;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@RestControllerAdvice
public class Errors {

  @ExceptionHandler(ApiException.class)
  ResponseEntity<?> known(ApiException e) {
    return ResponseEntity.status(e.status).body(
      Map.of("error", e.getMessage())
    );
  }

  @ExceptionHandler(
    org.springframework.dao.DataIntegrityViolationException.class
  )
  ResponseEntity<?> conflict(Exception e) {
    return ResponseEntity.status(409).body(
      Map.of("error", "Ä°ÅŸlem mevcut kayÄ±tlarla Ã§akÄ±ÅŸÄ±yor.")
    );
  }

  @ExceptionHandler({
    org.springframework.http.converter.HttpMessageNotReadableException.class,
    org.springframework.web.method.annotation.MethodArgumentTypeMismatchException.class,
  })
  ResponseEntity<?> bad(Exception e) {
    return ResponseEntity.badRequest().body(
      Map.of("error", "GeÃ§ersiz istek.")
    );
  }

  @ExceptionHandler(
    org.springframework.web.servlet.resource.NoResourceFoundException.class
  )
  ResponseEntity<?> missing(Exception e) {
    return ResponseEntity.status(404).body(
      Map.of("error", "Kayıt bulunamadı.")
    );
  }

  @ExceptionHandler(
    org.springframework.web.HttpRequestMethodNotSupportedException.class
  )
  ResponseEntity<?> method(Exception e) {
    return ResponseEntity.status(405).body(
      Map.of("error", "Yöntem desteklenmiyor.")
    );
  }

  @ExceptionHandler(Exception.class)
  ResponseEntity<?> other(Exception e) {
    org.slf4j.LoggerFactory.getLogger(Errors.class).error("Request failed", e);
    return ResponseEntity.internalServerError().body(
      Map.of("error", "Ä°ÅŸlem tamamlanamadÄ±.")
    );
  }
}
