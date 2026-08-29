<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreMedicalHistoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Authorization is handled at the controller level
    }

    public function rules(): array
    {
        return [
            'content' => ['required', 'string', 'min:5'],
        ];
    }
}
