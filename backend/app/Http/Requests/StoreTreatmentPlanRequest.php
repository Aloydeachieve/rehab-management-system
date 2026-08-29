<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreTreatmentPlanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'goals' => ['required', 'string'],
            'plan' => ['required', 'string'],
            'review_date' => ['nullable', 'date', 'after_or_equal:today'],
            'status' => ['nullable', 'string', 'max:50'],
        ];
    }
}
