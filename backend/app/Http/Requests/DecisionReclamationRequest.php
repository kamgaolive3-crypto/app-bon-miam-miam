<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class DecisionReclamationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'decision'            => ['required', 'in:validee,rejetee'],
            'reponse_reclamation' => ['required', 'string', 'max:2000'],
        ];
    }

    public function messages(): array
    {
        return [
            'decision.in'                  => 'La décision doit être « validee » ou « rejetee ».',
            'reponse_reclamation.required' => 'Une réponse est obligatoire.',
        ];
    }
}
