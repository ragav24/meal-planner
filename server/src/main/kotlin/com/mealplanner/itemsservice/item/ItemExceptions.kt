package com.mealplanner.itemsservice.item

class DuplicateItemException(val existing: MasterItem) : RuntimeException(
	"An item named '${existing.name}' already exists",
)

class ItemNotFoundException(val id: String) : RuntimeException("No item found with id '$id'")
