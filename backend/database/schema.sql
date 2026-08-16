-- =====================================================
-- HOSPITAL MANAGEMENT SYSTEM V2
-- PostgreSQL Database Schema
-- =====================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- =====================================================
-- USERS
-- =====================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,

    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,

    role VARCHAR(30) NOT NULL DEFAULT 'staff',

    phone VARCHAR(30),

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT users_role_check
        CHECK (role IN (
            'admin',
            'doctor',
            'nurse',
            'receptionist',
            'pharmacist',
            'lab_technician',
            'accountant',
            'staff'
        ))
);


-- =====================================================
-- DEPARTMENTS
-- =====================================================

CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(150) UNIQUE NOT NULL,
    description TEXT,

    phone VARCHAR(30),

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);