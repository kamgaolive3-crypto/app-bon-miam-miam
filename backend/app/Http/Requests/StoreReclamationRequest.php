<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreReclamationRequest extends FormRequest
{
    // Les droits par rôle sont vérifiés dans le contrôleur
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'Id_commande'             => ['required', 'string', 'size:8', 'exists:commande,Id_commande'],
            'motif_reclamation'       => ['required', 'string', 'max:255'],
            'description_reclamation' => ['nullable', 'string', 'max:2000'],
        ];
    }

    public function messages(): array
    {
        return [
            'Id_commande.required'       => 'La commande est obligatoire.',
            'Id_commande.exists'         => 'Cette commande n\'existe pas.',
            'motif_reclamation.required' => 'Le motif est obligatoire.',
        ];
    }
}
