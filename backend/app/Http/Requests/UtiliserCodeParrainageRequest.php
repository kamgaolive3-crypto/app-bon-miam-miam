<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UtiliserCodeParrainageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    // Le code est stocké en majuscules : on accepte « abcd1234 » et on le normalise
    protected function prepareForValidation(): void
    {
        if ($this->has('code_parrainage')) {
            $this->merge(['code_parrainage' => strtoupper((string) $this->input('code_parrainage'))]);
        }
    }

    public function rules(): array
    {
        return [
            'code_parrainage' => ['required', 'string', 'regex:/^[A-Z]{4}[0-9]{4}$/'],
        ];
    }

    public function messages(): array
    {
        return [
            'code_parrainage.regex' => 'Le code doit comporter 4 lettres suivies de 4 chiffres.',
        ];
    }
}