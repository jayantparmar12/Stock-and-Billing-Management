package com.jayant.backend.exception;

import com.jayant.backend.DTO.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ApiResponse<Object>> handleResponseStatusException(
            ResponseStatusException ex,
            HttpServletRequest request
    ){
        return new ResponseEntity<>(
                new ApiResponse<>(false, ex.getReason(), null),
                ex.getStatusCode());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Object>> handleValidationException(
            MethodArgumentNotValidException ex,
            HttpServletRequest request
    ) {
        String message = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .collect(java.util.stream.Collectors.joining(", "));

        if (message.isEmpty()) {
            message = "Request validation failed";
        }
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(new ApiResponse<>(false, message, null));
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiResponse<Object>> handleTypeMismatch(
            MethodArgumentTypeMismatchException ex,
            HttpServletRequest request
    ) {
        String message = "Invalid value for parameter: " + ex.getName();
        return new ResponseEntity<>(new ApiResponse<>(false, message, null), HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ApiResponse<Object>> handleRequestParameter(
            MissingServletRequestParameterException ex,
            HttpServletRequest request
    ) {
        String message = "Required parameter is missing: " + ex.getParameterName();
        return new ResponseEntity<>(new ApiResponse<>(false, message, null), HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiResponse<Object>> handleDataViolation(
            DataIntegrityViolationException ex,
            HttpServletRequest request
    ) {
        String message = "Data integrity violation";

        Throwable cause = ex.getMostSpecificCause();
        String details = cause.getMessage();

        if (details != null && details.toLowerCase().contains("duplicate")) {
            message = "A record with this value already exists";
        } else if (details != null && details.toLowerCase().contains("foreign key")) {
            message = "Related record does not exist or is still in use";
        }

        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(new ApiResponse<>(false, message, null));
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ApiResponse<Object>> handleMethodNotSupported(
            HttpRequestMethodNotSupportedException ex,
            HttpServletRequest request
    ) {
        return new ResponseEntity<>(new ApiResponse<>(false, "HTTP method " + ex.getMethod()+ " is not supported for this endpoint", null), HttpStatus.METHOD_NOT_ALLOWED);
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ApiResponse<Object>> handleNoResourceException(
            NoResourceFoundException ex,
            HttpServletRequest request
    ) {
        return new ResponseEntity<>(new ApiResponse<>(false, ex.getMessage(), null), HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Object>> handleGenericException(
            Exception ex,
            HttpServletRequest request
    ) {

        System.err.println(ex.getClass().getName());
        ex.printStackTrace();

        return new ResponseEntity<>(
                new ApiResponse<>(false, "Internal server error", null),
                HttpStatus.INTERNAL_SERVER_ERROR
        );
    }
}
