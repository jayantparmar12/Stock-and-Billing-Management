package com.jayant.backend.repository;

import com.jayant.backend.Entity.AppUser;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepo extends JpaRepository<AppUser, Integer> {
    @Cacheable(value = "users", key = "#email")
    Optional<AppUser> findByEmail(String email);
    boolean existsByEmail(String email);
}
