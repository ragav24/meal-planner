package com.mealplanner.itemsservice.item

import org.springframework.data.annotation.Id
import org.springframework.data.mongodb.core.index.Indexed
import org.springframework.data.mongodb.core.mapping.Document
import java.time.Instant

@Document(collection = "masterItems")
data class MasterItem(
	@Id
	val id: String? = null,
	val name: String,
	@Indexed(unique = true)
	val normalizedName: String,
	val createdAt: Instant = Instant.now(),
)
