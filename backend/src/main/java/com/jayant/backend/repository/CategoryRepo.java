package com.jayant.backend.repository;

import com.jayant.backend.Entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CategoryRepo extends JpaRepository<Category, Integer> {
    List<Category> findByShopId(Integer shopId);
    Optional<Category> findByIdAndShopId(Integer id, Integer shopId);
}
