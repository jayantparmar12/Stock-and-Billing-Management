package com.jayant.backend.controller;

import com.jayant.backend.DTO.ApiResponse;
import com.jayant.backend.DTO.CategoryResponse;
import com.jayant.backend.Entity.Category;
import com.jayant.backend.services.CategoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("api/categories")
public class CategoryController {
    private final CategoryService categoryService;

    @GetMapping
    public ApiResponse<List<Category>> getAllCategories() {
        return categoryService.getAllCategory();
    }

    @GetMapping("/{id}")
    public ApiResponse<Category> getCategory(@PathVariable Integer id) {
        return categoryService.getCategoryById(id);
    }

    @PostMapping
    public ApiResponse<Category> addCategory(@Valid @RequestBody Category category) {
        return categoryService.addCategory(category);
    }

    @PutMapping
    public ApiResponse<Category> editCategory(@Valid @RequestBody Category category) {
        return categoryService.editCategory(category);
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteCategory(@PathVariable Integer id) {
        return categoryService.deleteCategory(id);
    }
}
