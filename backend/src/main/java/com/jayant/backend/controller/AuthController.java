package com.jayant.backend.controller;

import com.jayant.backend.DTO.ApiResponse;
import com.jayant.backend.DTO.AuthResponse;
import com.jayant.backend.DTO.LoginRequest;
import com.jayant.backend.DTO.RegisterRequest;
import com.jayant.backend.repository.ShopRepo;
import com.jayant.backend.services.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final ShopRepo shopRepo;

    @PostMapping("/register")
    public ApiResponse<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public ApiResponse<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @GetMapping("/ping")
    public String ping() {
        long count = shopRepo.count();
        return "OK" + count;
    }
}