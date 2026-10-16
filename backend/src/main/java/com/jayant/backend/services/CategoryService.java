package com.jayant.backend.services;

import com.jayant.backend.DTO.ApiResponse;
import com.jayant.backend.Entity.Category;
import com.jayant.backend.repository.CategoryRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryService {
    private final CategoryRepo categoryRepo;

    public ApiResponse<List<Category>> getAllCategory() {
        return new ApiResponse<>(true, "List of Categories", categoryRepo.findAll());
    }

    public ApiResponse<Category> getCategoryById(Integer id) {
        Category category = categoryRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Category Not Found with id : "+id
                ));
        return new ApiResponse<>(true, "Category by id : "+id, category);
    }

    public ApiResponse<Category> addCategory(Category category) {
        return new ApiResponse<>(true, "Category added successfully",categoryRepo.save(category));
    }

    public ApiResponse<Category> editCategory(Category category) {
        if(categoryRepo.existsById(category.getId())) {
            return new ApiResponse<>(true, "Category edited successfully", categoryRepo.save(category));
        }
        throw new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Category Not Found with id : "+category.getId()
        );
    }

    public ApiResponse<Void> deleteCategory(Integer id) {
        if(categoryRepo.existsById(id)) {
            categoryRepo.deleteById(id);
        }
        else {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Category Not Found with id : "+id
            );
        }
        return new ApiResponse<>(true, "Category deleted successfully", null);
    }
}
