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


    -- =====================================================
-- LABORATORY TESTS
-- =====================================================

CREATE TABLE lab_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(200) NOT NULL,
    category VARCHAR(100),

    description TEXT,

    price NUMERIC(10, 2) NOT NULL DEFAULT 0,

    normal_range TEXT,
    unit VARCHAR(50),

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT lab_tests_price_check
        CHECK (price >= 0)
);


-- =====================================================
-- LAB ORDERS
-- =====================================================

CREATE TABLE lab_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    patient_id UUID NOT NULL,
    doctor_id UUID NOT NULL,
    appointment_id UUID,

    order_date TIMESTAMP WITH TIME ZONE
        DEFAULT CURRENT_TIMESTAMP,

    status VARCHAR(30) NOT NULL DEFAULT 'ordered',

    clinical_notes TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT lab_orders_patient_fk
        FOREIGN KEY (patient_id)
        REFERENCES patients(id)
        ON DELETE RESTRICT,

    CONSTRAINT lab_orders_doctor_fk
        FOREIGN KEY (doctor_id)
        REFERENCES doctors(id)
        ON DELETE RESTRICT,

    CONSTRAINT lab_orders_appointment_fk
        FOREIGN KEY (appointment_id)
        REFERENCES appointments(id)
        ON DELETE SET NULL,

    CONSTRAINT lab_orders_status_check
        CHECK (
            status IN (
                'ordered',
                'sample_collected',
                'processing',
                'completed',
                'cancelled'
            )
        )
);


-- =====================================================
-- LAB ORDER ITEMS
-- =====================================================

CREATE TABLE lab_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    lab_order_id UUID NOT NULL,
    lab_test_id UUID NOT NULL,

    result TEXT,
    result_value VARCHAR(200),

    result_unit VARCHAR(50),
    reference_range TEXT,

    status VARCHAR(30) NOT NULL DEFAULT 'pending',

    technician_notes TEXT,

    completed_at TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT lab_order_items_order_fk
        FOREIGN KEY (lab_order_id)
        REFERENCES lab_orders(id)
        ON DELETE CASCADE,

    CONSTRAINT lab_order_items_test_fk
        FOREIGN KEY (lab_test_id)
        REFERENCES lab_tests(id)
        ON DELETE RESTRICT,

    CONSTRAINT lab_order_items_status_check
        CHECK (
            status IN (
                'pending',
                'processing',
                'completed',
                'cancelled'
            )
        )
);


-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_lab_tests_name
    ON lab_tests(name);

CREATE INDEX idx_lab_tests_category
    ON lab_tests(category);

CREATE INDEX idx_lab_orders_patient
    ON lab_orders(patient_id);

CREATE INDEX idx_lab_orders_doctor
    ON lab_orders(doctor_id);

CREATE INDEX idx_lab_orders_date
    ON lab_orders(order_date);

CREATE INDEX idx_lab_orders_status
    ON lab_orders(status);

CREATE INDEX idx_lab_order_items_order
    ON lab_order_items(lab_order_id);

CREATE INDEX idx_lab_order_items_test
    ON lab_order_items(lab_test_id);


    -- =====================================================
-- INVOICES
-- =====================================================

CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    invoice_number VARCHAR(50) UNIQUE NOT NULL,

    patient_id UUID NOT NULL,

    appointment_id UUID,

    subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0,
    discount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    tax NUMERIC(10, 2) NOT NULL DEFAULT 0,
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,

    amount_paid NUMERIC(10, 2) NOT NULL DEFAULT 0,
    balance_due NUMERIC(10, 2) NOT NULL DEFAULT 0,

    status VARCHAR(30) NOT NULL DEFAULT 'unpaid',

    due_date DATE,

    notes TEXT,

    created_by UUID,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT invoices_patient_fk
        FOREIGN KEY (patient_id)
        REFERENCES patients(id)
        ON DELETE RESTRICT,

    CONSTRAINT invoices_appointment_fk
        FOREIGN KEY (appointment_id)
        REFERENCES appointments(id)
        ON DELETE SET NULL,

    CONSTRAINT invoices_created_by_fk
        FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT invoices_subtotal_check
        CHECK (subtotal >= 0),

    CONSTRAINT invoices_discount_check
        CHECK (discount >= 0),

    CONSTRAINT invoices_tax_check
        CHECK (tax >= 0),

    CONSTRAINT invoices_total_check
        CHECK (total_amount >= 0),

    CONSTRAINT invoices_paid_check
        CHECK (amount_paid >= 0),

    CONSTRAINT invoices_balance_check
        CHECK (balance_due >= 0),

    CONSTRAINT invoices_status_check
        CHECK (
            status IN (
                'unpaid',
                'partially_paid',
                'paid',
                'overdue',
                'cancelled'
            )
        )
);


-- =====================================================
-- INVOICE ITEMS
-- =====================================================

CREATE TABLE invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    invoice_id UUID NOT NULL,

    description VARCHAR(255) NOT NULL,

    quantity INTEGER NOT NULL DEFAULT 1,

    unit_price NUMERIC(10, 2) NOT NULL DEFAULT 0,

    total_price NUMERIC(10, 2) NOT NULL DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT invoice_items_invoice_fk
        FOREIGN KEY (invoice_id)
        REFERENCES invoices(id)
        ON DELETE CASCADE,

    CONSTRAINT invoice_items_quantity_check
        CHECK (quantity > 0),

    CONSTRAINT invoice_items_unit_price_check
        CHECK (unit_price >= 0),

    CONSTRAINT invoice_items_total_price_check
        CHECK (total_price >= 0)
);


-- =====================================================
-- PAYMENTS
-- =====================================================

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    invoice_id UUID NOT NULL,

    amount NUMERIC(10, 2) NOT NULL,

    payment_method VARCHAR(30) NOT NULL,

    transaction_reference VARCHAR(150),

    payment_date TIMESTAMP WITH TIME ZONE
        DEFAULT CURRENT_TIMESTAMP,

    received_by UUID,

    notes TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT payments_invoice_fk
        FOREIGN KEY (invoice_id)
        REFERENCES invoices(id)
        ON DELETE RESTRICT,

    CONSTRAINT payments_received_by_fk
        FOREIGN KEY (received_by)
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT payments_amount_check
        CHECK (amount > 0),

    CONSTRAINT payments_method_check
        CHECK (
            payment_method IN (
                'cash',
                'card',
                'bank_transfer',
                'mobile_money',
                'insurance'
            )
        )
);


-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_invoices_patient
    ON invoices(patient_id);

CREATE INDEX idx_invoices_appointment
    ON invoices(appointment_id);

CREATE INDEX idx_invoices_status
    ON invoices(status);

CREATE INDEX idx_invoices_due_date
    ON invoices(due_date);

CREATE INDEX idx_invoice_items_invoice
    ON invoice_items(invoice_id);

CREATE INDEX idx_payments_invoice
    ON payments(invoice_id);

CREATE INDEX idx_payments_date
    ON payments(payment_date);