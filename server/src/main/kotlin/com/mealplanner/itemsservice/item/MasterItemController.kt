package com.mealplanner.itemsservice.item

import com.mealplanner.itemsservice.item.dto.CreateItemRequest
import com.mealplanner.itemsservice.item.dto.MasterItemResponse
import com.mealplanner.itemsservice.item.dto.UpdateItemRequest
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/items")
class MasterItemController(private val service: MasterItemService) {

	@GetMapping
	fun list(): List<MasterItemResponse> = service.listAll()

	@PostMapping
	fun create(@Valid @RequestBody request: CreateItemRequest): ResponseEntity<MasterItemResponse> {
		val (item, created) = service.create(request.name)
		return ResponseEntity.status(if (created) HttpStatus.CREATED else HttpStatus.OK).body(item)
	}

	@PutMapping("/{id}")
	fun rename(@PathVariable id: String, @Valid @RequestBody request: UpdateItemRequest): MasterItemResponse =
		service.rename(id, request.name)

	@DeleteMapping("/{id}")
	fun delete(@PathVariable id: String): ResponseEntity<Void> {
		service.delete(id)
		return ResponseEntity.noContent().build()
	}
}
