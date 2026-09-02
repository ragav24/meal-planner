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

data class UpdateMealTypesRequest(
	val mealTypes: List<String> = emptyList(),
)

data class MasterItemResponse(
	val id: String,
	val name: String,
	val mealTypes: List<String> = emptyList(),
) {
	companion object {
		fun from(item: MasterItem) = MasterItemResponse(id = item.id!!, name = item.name, mealTypes = item.mealTypes.toList())
	}
}
