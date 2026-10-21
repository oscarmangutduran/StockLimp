<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class StoreOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'id_user' => 'required|exists:users,id_user',
            'id_centro' => 'nullable|exists:centros_trabajo,id_centro',
            'productos' => 'required|array|min:1',
            'productos.*.id_producto' => 'required|exists:productos,id_producto',
            'productos.*.cantidad' => 'required|numeric|min:0.01',
            'observaciones' => 'nullable|string|max:1000',
        ];
    }

    public function messages(): array
    {
        return [
            'id_user.required' => 'El operario solicitante es obligatorio.',
            'id_user.exists' => 'El operario seleccionado no existe en el sistema.',
            'id_centro.exists' => 'El centro de trabajo seleccionado no existe.',
            'productos.required' => 'Debes incluir al menos un producto en el pedido.',
            'productos.min' => 'El pedido debe contener al menos un producto.',
            'productos.*.id_producto.required' => 'Identificador de producto no especificado.',
            'productos.*.id_producto.exists' => 'Uno de los productos seleccionados no existe.',
            'productos.*.cantidad.required' => 'La cantidad de producto es obligatoria.',
            'productos.*.cantidad.min' => 'La cantidad solicitada debe ser mayor a 0.',
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
