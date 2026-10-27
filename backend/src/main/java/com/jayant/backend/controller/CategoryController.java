package com.jayant.backend.controller;

import com.jayant.backend.DTO.ApiResponse;
import com.jayant.backend.DTO.CategoryResponse;
import com.jayant.backend.DTO.ProductResponse;
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
    public ApiResponse<List<CategoryResponse>> getAllCategory() {
        return categoryService.getAllCategory();
    }

    @GetMapping("/{id}")
    public ApiResponse<CategoryResponse> getCategoryById(@PathVariable Integer id) {
        return categoryService.getCategoryById(id);
    }

    @PostMapping
    public ApiResponse<CategoryResponse> addCategory(@Valid @RequestBody Category category) {
        return categoryService.addCategory(category);
    }

    @PutMapping
    public ApiResponse<CategoryResponse> editCategory(@Valid @RequestBody Category category) {
        return categoryService.editCategory(category);
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteCategory(@PathVariable Integer id) {
        return categoryService.deleteCategory(id);
    }

    @GetMapping("/{id}/products")
    public ApiResponse<List<ProductResponse>> getProductsByCategory(@PathVariable Integer id) {
        return categoryService.getProductsByCategory(id);
    }
}
