<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTreatmentPricingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() && $this->user()->isAdmin();
    }

    public function rules(): array
    {
        return [
            'initial_session_price' => ['required', 'numeric', 'min:0'],
            'subsequent_session_price' => ['required', 'numeric', 'min:0'],
            'currency' => ['required', 'string', 'max:10'],
            'session_duration_days' => ['required', 'integer', 'min:1', 'max:365'],
        ];
    }
}
