package com.mealplanner.itemsservice.item

import org.springframework.data.mongodb.repository.MongoRepository

interface MasterItemRepository : MongoRepository<MasterItem, String> {
	fun findByNormalizedName(normalizedName: String): MasterItem?
}
