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

-- =====================================================
-- PATIENTS
-- =====================================================

CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    patient_number VARCHAR(30) UNIQUE NOT NULL,

    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,

    date_of_birth DATE,
    gender VARCHAR(20),

    phone VARCHAR(30),
    email VARCHAR(255),

    address TEXT,
    emergency_contact_name VARCHAR(150),
    emergency_contact_phone VARCHAR(30),

    blood_type VARCHAR(5),

    allergies TEXT,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT patients_gender_check
        CHECK (gender IN ('male', 'female', 'other') OR gender IS NULL),

    CONSTRAINT patients_blood_type_check
        CHECK (
            blood_type IN (
                'A+', 'A-', 'B+', 'B-',
                'AB+', 'AB-', 'O+', 'O-'
            )
            OR blood_type IS NULL
        )
);


-- =====================================================
-- DOCTORS
-- =====================================================

CREATE TABLE doctors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID UNIQUE NOT NULL,
    department_id UUID,

    license_number VARCHAR(100) UNIQUE NOT NULL,
    specialty VARCHAR(150) NOT NULL,

    consultation_fee NUMERIC(10, 2) DEFAULT 0,

    years_of_experience INTEGER DEFAULT 0,

    is_available BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT doctors_user_fk
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE RESTRICT,

    CONSTRAINT doctors_department_fk
        FOREIGN KEY (department_id)
        REFERENCES departments(id)
        ON DELETE SET NULL,

    CONSTRAINT doctors_experience_check
        CHECK (years_of_experience >= 0),

    CONSTRAINT doctors_fee_check
        CHECK (consultation_fee >= 0)
);


-- =====================================================
-- APPOINTMENTS
-- =====================================================

CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    patient_id UUID NOT NULL,
    doctor_id UUID NOT NULL,
    department_id UUID,

    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,

    reason TEXT,

    status VARCHAR(30) NOT NULL DEFAULT 'scheduled',

    notes TEXT,

    created_by UUID,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT appointments_patient_fk
        FOREIGN KEY (patient_id)
        REFERENCES patients(id)
        ON DELETE RESTRICT,

    CONSTRAINT appointments_doctor_fk
        FOREIGN KEY (doctor_id)
        REFERENCES doctors(id)
        ON DELETE RESTRICT,

    CONSTRAINT appointments_department_fk
        FOREIGN KEY (department_id)
        REFERENCES departments(id)
        ON DELETE SET NULL,

    CONSTRAINT appointments_created_by_fk
        FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT appointments_status_check
        CHECK (
            status IN (
                'scheduled',
                'confirmed',
                'completed',
                'cancelled',
                'no_show'
            )
        )
);


-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_patients_name
    ON patients(last_name, first_name);

CREATE INDEX idx_patients_phone
    ON patients(phone);

CREATE INDEX idx_doctors_department
    ON doctors(department_id);

CREATE INDEX idx_appointments_patient
    ON appointments(patient_id);

CREATE INDEX idx_appointments_doctor
    ON appointments(doctor_id);

CREATE INDEX idx_appointments_date
    ON appointments(appointment_date);

CREATE INDEX idx_appointments_status
    ON appointments(status);



    -- =====================================================
-- MEDICAL RECORDS
-- =====================================================

CREATE TABLE medical_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    patient_id UUID NOT NULL,
    doctor_id UUID NOT NULL,
    appointment_id UUID,

    diagnosis TEXT NOT NULL,
    symptoms TEXT,
    treatment_plan TEXT,

    notes TEXT,

    record_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT medical_records_patient_fk
        FOREIGN KEY (patient_id)
        REFERENCES patients(id)
        ON DELETE RESTRICT,

    CONSTRAINT medical_records_doctor_fk
        FOREIGN KEY (doctor_id)
        REFERENCES doctors(id)
        ON DELETE RESTRICT,

    CONSTRAINT medical_records_appointment_fk
        FOREIGN KEY (appointment_id)
        REFERENCES appointments(id)
        ON DELETE SET NULL
);


-- =====================================================
-- PRESCRIPTIONS
-- =====================================================

CREATE TABLE prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    patient_id UUID NOT NULL,
    doctor_id UUID NOT NULL,
    medical_record_id UUID,

    prescription_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    notes TEXT,

    status VARCHAR(30) NOT NULL DEFAULT 'active',

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT prescriptions_patient_fk
        FOREIGN KEY (patient_id)
        REFERENCES patients(id)
        ON DELETE RESTRICT,

    CONSTRAINT prescriptions_doctor_fk
        FOREIGN KEY (doctor_id)
        REFERENCES doctors(id)
        ON DELETE RESTRICT,

    CONSTRAINT prescriptions_medical_record_fk
        FOREIGN KEY (medical_record_id)
        REFERENCES medical_records(id)
        ON DELETE SET NULL,

    CONSTRAINT prescriptions_status_check
        CHECK (
            status IN (
                'active',
                'completed',
                'cancelled'
            )
        )
);


-- =====================================================
-- PRESCRIPTION ITEMS
-- =====================================================

CREATE TABLE prescription_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    prescription_id UUID NOT NULL,

    medicine_name VARCHAR(200) NOT NULL,

    dosage VARCHAR(100),
    frequency VARCHAR(100),
    duration VARCHAR(100),

    quantity INTEGER,

    instructions TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT prescription_items_prescription_fk
        FOREIGN KEY (prescription_id)
        REFERENCES prescriptions(id)
        ON DELETE CASCADE,

    CONSTRAINT prescription_items_quantity_check
        CHECK (quantity IS NULL OR quantity > 0)
);


-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_medical_records_patient
    ON medical_records(patient_id);

CREATE INDEX idx_medical_records_doctor
    ON medical_records(doctor_id);

CREATE INDEX idx_medical_records_date
    ON medical_records(record_date);

CREATE INDEX idx_prescriptions_patient
    ON prescriptions(patient_id);

CREATE INDEX idx_prescriptions_doctor
    ON prescriptions(doctor_id);

CREATE INDEX idx_prescription_items_prescription
    ON prescription_items(prescription_id);

    -- =====================================================
-- MEDICINES
-- =====================================================

CREATE TABLE medicines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(200) NOT NULL,
    generic_name VARCHAR(200),

    category VARCHAR(100),
    description TEXT,

    manufacturer VARCHAR(200),

    unit VARCHAR(50) NOT NULL DEFAULT 'unit',

    quantity_in_stock INTEGER NOT NULL DEFAULT 0,
    reorder_level INTEGER NOT NULL DEFAULT 10,

    unit_price NUMERIC(10, 2) NOT NULL DEFAULT 0,

    expiry_date DATE,

    batch_number VARCHAR(100),

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT medicines_stock_check
        CHECK (quantity_in_stock >= 0),

    CONSTRAINT medicines_reorder_check
        CHECK (reorder_level >= 0),

    CONSTRAINT medicines_price_check
        CHECK (unit_price >= 0)
);


-- =====================================================
-- PHARMACY DISPENSING
-- =====================================================

CREATE TABLE pharmacy_dispensing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    patient_id UUID NOT NULL,
    prescription_id UUID,

    dispensed_by UUID,

    dispensing_date TIMESTAMP WITH TIME ZONE
        DEFAULT CURRENT_TIMESTAMP,

    status VARCHAR(30) NOT NULL DEFAULT 'pending',

    notes TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pharmacy_patient_fk
        FOREIGN KEY (patient_id)
        REFERENCES patients(id)
        ON DELETE RESTRICT,

    CONSTRAINT pharmacy_prescription_fk
        FOREIGN KEY (prescription_id)
        REFERENCES prescriptions(id)
        ON DELETE SET NULL,

    CONSTRAINT pharmacy_dispensed_by_fk
        FOREIGN KEY (dispensed_by)
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT pharmacy_status_check
        CHECK (
            status IN (
                'pending',
                'dispensed',
                'cancelled'
            )
        )
);


-- =====================================================
-- PHARMACY DISPENSING ITEMS
-- =====================================================

CREATE TABLE pharmacy_dispensing_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    dispensing_id UUID NOT NULL,
    medicine_id UUID NOT NULL,

    quantity INTEGER NOT NULL,

    unit_price NUMERIC(10, 2) NOT NULL DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE
        DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT dispensing_items_dispensing_fk
        FOREIGN KEY (dispensing_id)
        REFERENCES pharmacy_dispensing(id)
        ON DELETE CASCADE,

    CONSTRAINT dispensing_items_medicine_fk
        FOREIGN KEY (medicine_id)
        REFERENCES medicines(id)
        ON DELETE RESTRICT,

    CONSTRAINT dispensing_items_quantity_check
        CHECK (quantity > 0),

    CONSTRAINT dispensing_items_price_check
        CHECK (unit_price >= 0)
);


-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_medicines_name
    ON medicines(name);

CREATE INDEX idx_medicines_category
    ON medicines(category);

CREATE INDEX idx_medicines_expiry
    ON medicines(expiry_date);

CREATE INDEX idx_medicines_stock
    ON medicines(quantity_in_stock);

CREATE INDEX idx_pharmacy_patient
    ON pharmacy_dispensing(patient_id);

CREATE INDEX idx_pharmacy_prescription
    ON pharmacy_dispensing(prescription_id);

CREATE INDEX idx_pharmacy_items_dispensing
    ON pharmacy_dispensing_items(dispensing_id);

CREATE INDEX idx_pharmacy_items_medicine
    ON pharmacy_dispensing_items(medicine_id);