<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreClinicalNoteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'note_type' => ['required', 'string', 'max:100'],
            'content' => ['required', 'string'],
        ];
    }
}
