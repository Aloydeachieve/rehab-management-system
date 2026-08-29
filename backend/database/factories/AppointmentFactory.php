<?php

namespace Database\Factories;

use App\Models\Appointment;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Appointment>
 */
class AppointmentFactory extends Factory
{
    protected $model = Appointment::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'visitor_name' => $this->faker->name(),
            'visitor_phone' => $this->faker->phoneNumber(),
            'visitor_email' => $this->faker->safeEmail(),
            'reason' => $this->faker->sentence(),
            'preferred_at' => $this->faker->dateTimeBetween('now', '+1 month'),
            'status' => Appointment::STATUS_PENDING,
            'notes' => null,
        ];
    }
}
