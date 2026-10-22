<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UtiliserPointsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'points' => ['required', 'integer', 'min:1'],
        ];
    }

    public function messages(): array
    {
        return [
            'points.min' => 'Le nombre de points doit être supérieur à 0.',
        ];
    }
}
