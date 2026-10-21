<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class StoreProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nombre' => 'required|string|max:100',
            'sku' => 'nullable|string|max:100|unique:productos,sku',
            'precio_unidad' => 'required|numeric|min:0',
            'stock_actual' => 'required|numeric|min:0',
            'es_toxico' => 'nullable|boolean',
            'imagen' => 'nullable|string|max:255',
            'ficha_tecnica' => 'nullable|string|max:255'
        ];
    }

    public function messages(): array
    {
        return [
            'nombre.required' => 'El nombre del producto es obligatorio.',
            'sku.unique' => 'Ya existe un producto con el mismo código SKU.',
            'precio_unidad.required' => 'El precio unitario es obligatorio.',
            'precio_unidad.numeric' => 'El precio debe ser un número válido.',
            'stock_actual.required' => 'El stock actual es obligatorio.',
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
