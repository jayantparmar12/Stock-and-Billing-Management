package com.jayant.backend.services;

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

    public List<Category> getAllCategory() {
        return categoryRepo.findAll();
    }

    public Category getCategoryById(Integer id) {
        return categoryRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Category Not Found with id : "+id
                ));
    }

    public Category addCategory(Category category) {
        return categoryRepo.save(category);
    }

    public Category editCategory(Category category) {
        if(categoryRepo.existsById(category.getId())) {
            return categoryRepo.save(category);
        }
        throw new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Category Not Found with id : "+category.getId()
        );
    }

    public void deleteCategory(Integer id) {
        if(categoryRepo.existsById(id)) {
            categoryRepo.deleteById(id);
        }
        else {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Category Not Found with id : "+id
            );
        }
    }
}
