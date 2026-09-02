package com.mealplanner.itemsservice.item

import com.mealplanner.itemsservice.item.dto.MasterItemResponse
import org.springframework.dao.DuplicateKeyException
import org.springframework.stereotype.Service

@Service
class MasterItemService(private val repository: MasterItemRepository) {

	fun listAll(): List<MasterItemResponse> =
		repository.findAll()
			.sortedBy { it.name.lowercase() }
			.map(MasterItemResponse::from)

	/** Returns the item plus whether it was newly created (false = an existing item was returned idempotently). */
	fun create(name: String): Pair<MasterItemResponse, Boolean> {
		val trimmed = name.trim()
		val normalized = trimmed.lowercase()

		repository.findByNormalizedName(normalized)?.let {
			return MasterItemResponse.from(it) to false
		}

		val created = try {
			repository.save(MasterItem(name = trimmed, normalizedName = normalized))
		} catch (ex: DuplicateKeyException) {
			// Another request created it between our lookup and insert.
			val existing = repository.findByNormalizedName(normalized) ?: throw ex
			return MasterItemResponse.from(existing) to false
		}
		return MasterItemResponse.from(created) to true
	}

	fun rename(id: String, name: String): MasterItemResponse {
		val existing = repository.findById(id).orElseThrow { ItemNotFoundException(id) }
		val trimmed = name.trim()
		val normalized = trimmed.lowercase()

		repository.findByNormalizedName(normalized)?.let { collision ->
			if (collision.id != id) throw DuplicateItemException(collision)
		}

		val updated = repository.save(existing.copy(name = trimmed, normalizedName = normalized))
		return MasterItemResponse.from(updated)
	}

	fun delete(id: String) {
		repository.deleteById(id)
	}
}
