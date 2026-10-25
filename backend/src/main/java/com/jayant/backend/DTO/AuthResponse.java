package com.jayant.backend.DTO;

import com.jayant.backend.Entity.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private Integer id;
    private String name;
    private String email;
    private Role role;
    private Integer shopId;
    private String shopName;
    private String shopCode;
}