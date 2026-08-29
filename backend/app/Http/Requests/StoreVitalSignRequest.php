<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreVitalSignRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'temperature' => ['nullable', 'numeric', 'between:20,50'],
            'pulse' => ['nullable', 'integer', 'between:20,300'],
            'blood_pressure' => ['nullable', 'string', 'max:50'],
            'respiratory_rate' => ['nullable', 'integer', 'between:4,120'],
            'weight' => ['nullable', 'numeric', 'between:1,500'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
