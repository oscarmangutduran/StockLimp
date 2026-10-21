<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class UpdateProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'id_producto' => 'required|exists:productos,id_producto',
            'nombre' => 'sometimes|required|string|max:100',
            'sku' => 'nullable|string|max:100',
            'precio_unidad' => 'sometimes|required|numeric|min:0',
            'stock_actual' => 'sometimes|required|numeric|min:0',
            'es_toxico' => 'nullable|boolean',
            'imagen' => 'nullable|string|max:255',
            'ficha_tecnica' => 'nullable|string|max:255'
        ];
    }

    public function messages(): array
    {
        return [
            'id_producto.required' => 'El identificador del producto es obligatorio.',
            'id_producto.exists' => 'El producto especificado no existe.',
        ];
    }

    protected function failedValidation(Validator $validator)
    {
        throw new HttpResponseException(response()->json([
            'success' => false,
            'message' => $validator->errors()->first(),
            'errors' => $validator->errors()
        ], 422));
    }
}
