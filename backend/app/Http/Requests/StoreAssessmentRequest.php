<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreAssessmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'assessment_type' => ['required', 'string', 'max:255'],
            'findings' => ['required', 'string'],
            'recommendation' => ['required', 'string'],
        ];
    }
}
