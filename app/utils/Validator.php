<?php
/**
 * Validator Utility Class
 *
 * Input validation helper for API endpoints.
 * Provides common validation rules and sanitization.
 */

class Validator
{
    private array $errors = [];
    private array $data = [];

    /**
     * Create a new validator instance
     *
     * @param array $data Data to validate
     */
    public function __construct(array $data)
    {
        $this->data = $data;
    }

    /**
     * Static factory method
     *
     * @param array $data
     * @return self
     */
    public static function make(array $data): self
    {
        return new self($data);
    }

    /**
     * Check if validation passed
     *
     * @return bool
     */
    public function passes(): bool
    {
        return empty($this->errors);
    }

    /**
     * Check if validation failed
     *
     * @return bool
     */
    public function fails(): bool
    {
        return !empty($this->errors);
    }

    /**
     * Get validation errors
     *
     * @return array
     */
    public function errors(): array
    {
        return $this->errors;
    }

    /**
     * Get validated data
     *
     * @return array
     */
    public function validated(): array
    {
        return $this->data;
    }

    /**
     * Add a custom error
     *
     * @param string $field
     * @param string $message
     * @return self
     */
    public function addError(string $field, string $message): self
    {
        $this->errors[$field][] = $message;
        return $this;
    }

    /**
     * Validate required field
     *
     * @param string $field
     * @param string|null $message
     * @return self
     */
    public function required(string $field, ?string $message = null): self
    {
        if (!isset($this->data[$field]) || trim((string)$this->data[$field]) === '') {
            $this->errors[$field][] = $message ?? "{$field} is required";
        }
        return $this;
    }

    /**
     * Validate email format
     *
     * @param string $field
     * @param string|null $message
     * @return self
     */
    public function email(string $field, ?string $message = null): self
    {
        if (isset($this->data[$field]) && !filter_var($this->data[$field], FILTER_VALIDATE_EMAIL)) {
            $this->errors[$field][] = $message ?? "Invalid email format";
        }
        return $this;
    }

    /**
     * Validate minimum length
     *
     * @param string $field
     * @param int $length
     * @param string|null $message
     * @return self
     */
    public function minLength(string $field, int $length, ?string $message = null): self
    {
        if (isset($this->data[$field]) && strlen($this->data[$field]) < $length) {
            $this->errors[$field][] = $message ?? "{$field} must be at least {$length} characters";
        }
        return $this;
    }

    /**
     * Validate maximum length
     *
     * @param string $field
     * @param int $length
     * @param string|null $message
     * @return self
     */
    public function maxLength(string $field, int $length, ?string $message = null): self
    {
        if (isset($this->data[$field]) && strlen($this->data[$field]) > $length) {
            $this->errors[$field][] = $message ?? "{$field} must not exceed {$length} characters";
        }
        return $this;
    }

    /**
     * Validate numeric value
     *
     * @param string $field
     * @param string|null $message
     * @return self
     */
    public function numeric(string $field, ?string $message = null): self
    {
        if (isset($this->data[$field]) && !is_numeric($this->data[$field])) {
            $this->errors[$field][] = $message ?? "{$field} must be a number";
        }
        return $this;
    }

    /**
     * Validate integer value
     *
     * @param string $field
     * @param string|null $message
     * @return self
     */
    public function integer(string $field, ?string $message = null): self
    {
        if (isset($this->data[$field]) && filter_var($this->data[$field], FILTER_VALIDATE_INT) === false) {
            $this->errors[$field][] = $message ?? "{$field} must be an integer";
        }
        return $this;
    }

    /**
     * Validate minimum value
     *
     * @param string $field
     * @param int|float $min
     * @param string|null $message
     * @return self
     */
    public function min(string $field, int|float $min, ?string $message = null): self
    {
        if (isset($this->data[$field]) && $this->data[$field] < $min) {
            $this->errors[$field][] = $message ?? "{$field} must be at least {$min}";
        }
        return $this;
    }

    /**
     * Validate maximum value
     *
     * @param string $field
     * @param int|float $max
     * @param string|null $message
     * @return self
     */
    public function max(string $field, int|float $max, ?string $message = null): self
    {
        if (isset($this->data[$field]) && $this->data[$field] > $max) {
            $this->errors[$field][] = $message ?? "{$field} must not exceed {$max}";
        }
        return $this;
    }

    /**
     * Validate value is in array
     *
     * @param string $field
     * @param array $values
     * @param string|null $message
     * @return self
     */
    public function in(string $field, array $values, ?string $message = null): self
    {
        if (isset($this->data[$field]) && !in_array($this->data[$field], $values)) {
            $this->errors[$field][] = $message ?? "{$field} must be one of: " . implode(', ', $values);
        }
        return $this;
    }

    /**
     * Validate UUID format
     *
     * @param string $field
     * @param string|null $message
     * @return self
     */
    public function uuid(string $field, ?string $message = null): self
    {
        $pattern = '/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i';
        if (isset($this->data[$field]) && !preg_match($pattern, $this->data[$field])) {
            $this->errors[$field][] = $message ?? "{$field} must be a valid UUID";
        }
        return $this;
    }

    /**
     * Validate URL format
     *
     * @param string $field
     * @param string|null $message
     * @return self
     */
    public function url(string $field, ?string $message = null): self
    {
        if (isset($this->data[$field]) && !filter_var($this->data[$field], FILTER_VALIDATE_URL)) {
            $this->errors[$field][] = $message ?? "{$field} must be a valid URL";
        }
        return $this;
    }

    /**
     * Validate password strength
     *
     * @param string $field
     * @param string|null $message
     * @return self
     */
    public function password(string $field, ?string $message = null): self
    {
        if (isset($this->data[$field])) {
            $password = $this->data[$field];

            if (strlen($password) < 8) {
                $this->errors[$field][] = $message ?? "Password must be at least 8 characters";
            }
        }
        return $this;
    }

    /**
     * Validate fields match
     *
     * @param string $field
     * @param string $otherField
     * @param string|null $message
     * @return self
     */
    public function matches(string $field, string $otherField, ?string $message = null): self
    {
        if (isset($this->data[$field]) && isset($this->data[$otherField])) {
            if ($this->data[$field] !== $this->data[$otherField]) {
                $this->errors[$field][] = $message ?? "{$field} must match {$otherField}";
            }
        }
        return $this;
    }

    /**
     * Sanitize string input
     *
     * @param string $value
     * @return string
     */
    public static function sanitizeString(string $value): string
    {
        return htmlspecialchars(trim($value), ENT_QUOTES, 'UTF-8');
    }

    /**
     * Sanitize email input
     *
     * @param string $value
     * @return string
     */
    public static function sanitizeEmail(string $value): string
    {
        return filter_var(trim($value), FILTER_SANITIZE_EMAIL);
    }

    /**
     * Sanitize integer input
     *
     * @param mixed $value
     * @return int
     */
    public static function sanitizeInt(mixed $value): int
    {
        return (int) filter_var($value, FILTER_SANITIZE_NUMBER_INT);
    }

    /**
     * Generate a secure random token
     *
     * @param int $length
     * @return string
     */
    public static function generateToken(int $length = 32): string
    {
        return bin2hex(random_bytes($length));
    }

    /**
     * Generate a UUID v4
     *
     * @return string
     */
    public static function generateUUID(): string
    {
        $data = random_bytes(16);
        $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
        $data[8] = chr(ord($data[8]) & 0x3f | 0x80);

        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
    }
}
