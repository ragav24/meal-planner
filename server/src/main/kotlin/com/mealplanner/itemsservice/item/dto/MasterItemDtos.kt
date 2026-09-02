package com.mealplanner.itemsservice.item.dto

import com.mealplanner.itemsservice.item.MasterItem
import jakarta.validation.constraints.NotBlank

data class CreateItemRequest(
	@field:NotBlank
	val name: String,
)

data class UpdateItemRequest(
	@field:NotBlank
	val name: String,
)

data class MasterItemResponse(
	val id: String,
	val name: String,
) {
	companion object {
		fun from(item: MasterItem) = MasterItemResponse(id = item.id!!, name = item.name)
	}
}
