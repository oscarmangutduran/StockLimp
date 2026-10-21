<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class UpdateOrderStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'id_pedido' => 'required|exists:pedidos,id_pedido',
            'estado' => 'required|string|in:PENDIENTE,EN_PREPARACION,DESPACHADO,ENTREGADO,CANCELADO',
        ];
    }

    public function messages(): array
    {
        return [
            'id_pedido.required' => 'El identificador del pedido es obligatorio.',
            'id_pedido.exists' => 'El pedido especificado no existe.',
            'estado.required' => 'El nuevo estado es obligatorio.',
            'estado.in' => 'El estado proporcionado no es válido.',
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
