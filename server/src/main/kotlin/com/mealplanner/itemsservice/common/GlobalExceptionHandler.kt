package com.mealplanner.itemsservice.common

import com.mealplanner.itemsservice.item.DuplicateItemException
import com.mealplanner.itemsservice.item.ItemNotFoundException
import com.mealplanner.itemsservice.item.dto.MasterItemResponse
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice

data class ErrorResponse(
	val error: String,
	val message: String,
	val existingItem: MasterItemResponse? = null,
)

@RestControllerAdvice
class GlobalExceptionHandler {

	@ExceptionHandler(DuplicateItemException::class)
	fun handleDuplicate(ex: DuplicateItemException): ResponseEntity<ErrorResponse> =
		ResponseEntity.status(HttpStatus.CONFLICT).body(
			ErrorResponse(
				error = "DUPLICATE_NAME",
				message = ex.message.orEmpty(),
				existingItem = MasterItemResponse.from(ex.existing),
			),
		)

	@ExceptionHandler(ItemNotFoundException::class)
	fun handleNotFound(ex: ItemNotFoundException): ResponseEntity<ErrorResponse> =
		ResponseEntity.status(HttpStatus.NOT_FOUND).body(
			ErrorResponse(error = "NOT_FOUND", message = ex.message.orEmpty()),
		)

	@ExceptionHandler(MethodArgumentNotValidException::class)
	fun handleValidation(ex: MethodArgumentNotValidException): ResponseEntity<ErrorResponse> =
		ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
			ErrorResponse(
				error = "INVALID_NAME",
				message = ex.bindingResult.fieldErrors.firstOrNull()?.defaultMessage ?: "Invalid request",
			),
		)

	@ExceptionHandler(Exception::class)
	fun handleGeneric(ex: Exception): ResponseEntity<ErrorResponse> =
		ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
			ErrorResponse(error = "INTERNAL_ERROR", message = "Something went wrong"),
		)
}
