package dev.bera.app.common;

import jakarta.servlet.*;
import jakarta.servlet.http.*;
import java.io.*;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class RequestLimit extends OncePerRequestFilter {

  protected void doFilterInternal(
    HttpServletRequest req,
    HttpServletResponse res,
    FilterChain chain
  ) throws ServletException, IOException {
    if (req.getContentLengthLong() > 65536) {
      res.setStatus(413);
      res.setContentType("application/json");
      res.getWriter().write("{\"error\":\"Request body too large\"}");
      return;
    }
    chain.doFilter(req, res);
  }
}
