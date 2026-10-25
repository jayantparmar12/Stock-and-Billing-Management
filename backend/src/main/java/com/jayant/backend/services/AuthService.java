package com.jayant.backend.services;

import com.jayant.backend.DTO.ApiResponse;
import com.jayant.backend.DTO.AuthResponse;
import com.jayant.backend.DTO.LoginRequest;
import com.jayant.backend.DTO.RegisterRequest;
import com.jayant.backend.Entity.AppUser;
import com.jayant.backend.Entity.Role;
import com.jayant.backend.Entity.Shop;
import com.jayant.backend.repository.ShopRepo;
import com.jayant.backend.repository.UserRepo;
import com.jayant.backend.security.JwtUtil;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Random;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepo userRepo;
    private final ShopRepo shopRepo;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;

    @Transactional
    public ApiResponse<AuthResponse> register(RegisterRequest request) {
        if (userRepo.existsByEmail(request.getEmail().toLowerCase().trim())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email is already registered");
        }

        Role role = request.getRole() != null ? request.getRole() : Role.STAFF;
        Shop shop;

        if (role == Role.ADMIN && (request.getShopCode() == null || request.getShopCode().isBlank())) {

            if (request.getShopName() == null || request.getShopName().isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Shop / Company Name is required for Admin registration");
            }
            shop = new Shop();
            shop.setShopName(request.getShopName().trim());
            shop.setShopCode(generateUniqueShopCode(request.getShopName()));
            shop = shopRepo.save(shop);
        } else {
            if (request.getShopCode() == null || request.getShopCode().isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Shop Code is required to join an existing shop");
            }
            shop = shopRepo.findByShopCodeIgnoreCase(request.getShopCode().trim())
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.NOT_FOUND,
                            "Invalid Shop Code: " + request.getShopCode()
                    ));
        }

        AppUser user = new AppUser();
        user.setName(request.getName().trim());
        user.setEmail(request.getEmail().toLowerCase().trim());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(role);
        user.setShop(shop);

        user = userRepo.save(user);

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());

        AuthResponse authResponse = AuthResponse.builder()
                .token(token)
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .shopId(shop.getId())
                .shopName(shop.getShopName())
                .shopCode(shop.getShopCode())
                .build();

        return new ApiResponse<>(true, "Registered successfully", authResponse);
    }

    public ApiResponse<AuthResponse> login(LoginRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getEmail().toLowerCase().trim(),
                            request.getPassword()
                    )
            );
        } catch (BadCredentialsException ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }

        AppUser user = userRepo.findByEmail(request.getEmail().toLowerCase().trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        Shop shop = user.getShop();
        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());

        AuthResponse authResponse = AuthResponse.builder()
                .token(token)
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .shopId(shop != null ? shop.getId() : null)
                .shopName(shop != null ? shop.getShopName() : "")
                .shopCode(shop != null ? shop.getShopCode() : "")
                .build();

        return new ApiResponse<>(true, "Login successful", authResponse);
    }

    private String generateUniqueShopCode(String shopName) {
        String prefix = shopName.replaceAll("[^a-zA-Z]", "").toUpperCase();
        if (prefix.length() > 4) {
            prefix = prefix.substring(0, 4);
        } else if (prefix.isEmpty()) {
            prefix = "SHOP";
        }

        Random random = new Random();
        String code;
        do {
            int num = 1000 + random.nextInt(9000);
            code = prefix + "-" + num;
        } while (shopRepo.existsByShopCodeIgnoreCase(code));

        return code;
    }
}
