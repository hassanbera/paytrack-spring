package dev.bera.app.common;

import com.fasterxml.jackson.databind.JsonNode;
import java.time.*;
import java.util.*;

public final class Input {

  public static String text(JsonNode j, String k, int max, boolean required) {
    if (j == null || !j.isObject()) throw new ApiException(
      400,
      "JSON nesnesi gerekli."
    );
    JsonNode v = j.get(k);
    if (v != null && !v.isTextual()) throw new ApiException(
      400,
      k + " metin olmalÄ±."
    );
    String s = v == null ? "" : v.asText().trim();
    if ((required && s.isEmpty()) || s.length() > max) throw new ApiException(
      400,
      k + " geÃ§ersiz."
    );
    return s;
  }

  public static int number(JsonNode j, String k, int min, int max) {
    if (j == null || !j.isObject()) throw new ApiException(
      400,
      "JSON nesnesi gerekli."
    );
    var v = j.get(k);
    if (
      v == null ||
      !v.isIntegralNumber() ||
      !v.canConvertToInt() ||
      v.asInt() < min ||
      v.asInt() > max
    ) throw new ApiException(400, k + " geÃ§ersiz.");
    return v.asInt();
  }

  public static UUID id(JsonNode j, String k) {
    return uuid(text(j, k, 36, true));
  }

  public static UUID uuid(String s) {
    try {
      return UUID.fromString(s);
    } catch (Exception e) {
      throw new ApiException(400, "GeÃ§ersiz kimlik.");
    }
  }

  public static LocalDate date(JsonNode j, String k) {
    try {
      return LocalDate.parse(text(j, k, 10, true));
    } catch (Exception e) {
      throw new ApiException(400, "GeÃ§ersiz tarih.");
    }
  }

  public static Instant instant(JsonNode j, String k) {
    try {
      return Instant.parse(text(j, k, 40, true));
    } catch (Exception e) {
      throw new ApiException(400, "Saat dilimi iÃ§eren tarih gerekli.");
    }
  }

  public static String choice(JsonNode j, String k, String... allowed) {
    var s = text(j, k, 30, true);
    if (!List.of(allowed).contains(s)) throw new ApiException(
      400,
      k + " geÃ§ersiz."
    );
    return s;
  }

  public static <T> T found(Optional<T> v) {
    return v.orElseThrow(() -> new ApiException(404, "KayÄ±t bulunamadÄ±."));
  }

  public static String email(JsonNode j) {
    var s = text(j, "clientEmail", 200, false);
    if (
      !s.isEmpty() && !s.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")
    ) throw new ApiException(400, "E-posta geÃ§ersiz.");
    return s;
  }
}
