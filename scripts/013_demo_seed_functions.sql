-- Demo seed functions
-- - seed_demo_day(target_date, seed_type): generates synthetic daily operational data once per date
-- - seed_demo_baseline(): ensures baseline master data and backfills recent days
-- - run_scheduled_demo_seed(): timezone-aware entrypoint intended for cron

CREATE OR REPLACE FUNCTION public.seed_demo_day(
  target_date DATE DEFAULT CURRENT_DATE,
  seed_type TEXT DEFAULT 'daily'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_seed_type TEXT := LOWER(COALESCE(seed_type, 'daily'));
  v_existing_counts JSONB;
  v_active_profiles_count INTEGER := 0;

  v_note_target INTEGER := 6 + FLOOR(random() * 7)::INTEGER;
  v_complaint_target INTEGER := 2 + FLOOR(random() * 5)::INTEGER;
  v_issue_target INTEGER := 1 + FLOOR(random() * 4)::INTEGER;
  v_task_target INTEGER := 5 + FLOOR(random() * 7)::INTEGER;
  v_event_target INTEGER := 1 + FLOOR(random() * 3)::INTEGER;
  v_notification_target INTEGER := FLOOR(random() * 3)::INTEGER;

  v_notes_count INTEGER := 0;
  v_complaints_count INTEGER := 0;
  v_issues_count INTEGER := 0;
  v_note_comments_count INTEGER := 0;
  v_complaint_comments_count INTEGER := 0;
  v_issue_comments_count INTEGER := 0;
  v_tasks_count INTEGER := 0;
  v_shifts_count INTEGER := 0;
  v_events_count INTEGER := 0;
  v_attendees_count INTEGER := 0;
  v_notifications_count INTEGER := 0;

  v_roll DOUBLE PRECISION;
  v_created_at TIMESTAMPTZ;
  v_updated_at TIMESTAMPTZ;

  v_author_id UUID;
  v_department_id UUID;
  v_category_id UUID;
  v_assigned_to UUID;
  v_resolved_by UUID;
  v_created_by UUID;

  v_priority TEXT;
  v_status TEXT;

  v_complaint_id UUID;
  v_issue_id UUID;
  v_note_id UUID;
  v_event_id UUID;
  v_event_department UUID;
  v_tag_id UUID;
  v_comment_author_id UUID;

  v_shift_type TEXT;
  v_start_time TIME;
  v_end_time TIME;
  v_due_time TIME;

  v_note_title TEXT;
  v_note_content TEXT;
  v_complaint_title TEXT;
  v_complaint_description TEXT;
  v_issue_title TEXT;
  v_issue_description TEXT;
  v_task_title TEXT;
  v_task_description TEXT;
  v_event_title TEXT;
  v_event_description TEXT;
  v_notification_title TEXT;
  v_notification_content TEXT;

  v_counts JSONB;
  v_staff RECORD;
  v_comment_created_at TIMESTAMPTZ;
  v_comment_end_at TIMESTAMPTZ;
  v_comment_count INTEGER := 0;
  v_inserted_rows INTEGER := 0;
BEGIN
  IF target_date IS NULL THEN
    RAISE EXCEPTION 'target_date is required';
  END IF;

  IF v_seed_type NOT IN ('baseline', 'daily', 'manual') THEN
    RAISE EXCEPTION 'Unsupported seed_type: %', v_seed_type;
  END IF;

  SELECT COUNT(*)
  INTO v_active_profiles_count
  FROM public.profiles
  WHERE is_active = true
    AND department_id IS NOT NULL;

  IF v_active_profiles_count = 0 THEN
    RETURN jsonb_build_object(
      'ok', true,
      'seed_date', target_date,
      'seed_type', v_seed_type,
      'skipped', true,
      'reason', 'no_active_profiles_with_department'
    );
  END IF;

  SELECT counts INTO v_existing_counts
  FROM public.demo_seed_runs
  WHERE seed_date = target_date;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'ok', true,
      'seed_date', target_date,
      'seed_type', v_seed_type,
      'skipped', true,
      'reason', 'already_seeded',
      'counts', COALESCE(v_existing_counts, '{}'::JSONB)
    );
  END IF;

  -- Handover notes
  FOR i IN 1..v_note_target LOOP
    SELECT id, department_id
      INTO v_author_id, v_department_id
    FROM public.profiles
    WHERE is_active = true
      AND department_id IS NOT NULL
    ORDER BY random()
    LIMIT 1;

    IF v_author_id IS NULL OR v_department_id IS NULL THEN
      EXIT;
    END IF;

    IF random() < 0.85 THEN
      SELECT id INTO v_category_id
      FROM public.categories
      ORDER BY random()
      LIMIT 1;
    ELSE
      v_category_id := NULL;
    END IF;

    v_roll := random();
    IF v_roll < 0.12 THEN
      v_priority := 'urgent';
    ELSIF v_roll < 0.74 THEN
      v_priority := 'normal';
    ELSE
      v_priority := 'low';
    END IF;

    v_note_title := public.random_choice(ARRAY[
      'VIP arrival briefing',
      'Maintenance follow-up needed',
      'Late check-in coordination',
      'Housekeeping priority update',
      'Incident handover summary',
      'Guest request pending action',
      'Shift readiness checkpoint',
      'Team briefing highlights'
    ]::TEXT[]);

    v_note_content := public.random_choice(ARRAY[
      'Please carry this over to the next shift and confirm completion in comments.',
      'Guest-impacting details were logged. Monitor closely and update status by end of shift.',
      'Team member has initiated action. Next shift should verify closure before noon.',
      'Escalate to duty manager if no progress is made within the next 2 hours.',
      'Operational context captured. Coordinate with department lead during morning briefing.',
      'Action started but not complete. Keep this item visible in shift priorities.'
    ]::TEXT[]);

    v_created_at := public.random_timestamptz_on_date(target_date, 0, 23);
    v_updated_at := public.random_timestamptz_between(v_created_at + INTERVAL '10 minutes', v_created_at + INTERVAL '4 hours');

    INSERT INTO public.handover_notes (
      author_id,
      department_id,
      category_id,
      title,
      content,
      priority,
      note_date,
      created_at,
      updated_at
    ) VALUES (
      v_author_id,
      v_department_id,
      v_category_id,
      v_note_title,
      v_note_content,
      v_priority,
      target_date,
      v_created_at,
      v_updated_at
    ) RETURNING id INTO v_note_id;

    IF to_regclass('public.handover_note_comments') IS NOT NULL AND v_note_id IS NOT NULL AND random() < 0.82 THEN
      v_comment_count := 1 + FLOOR(random() * 3)::INTEGER;

      FOR j IN 1..v_comment_count LOOP
        SELECT id
        INTO v_comment_author_id
        FROM public.profiles
        WHERE is_active = true
          AND (
            department_id = v_department_id
            OR role IN ('admin', 'manager')
            OR id = v_author_id
          )
        ORDER BY random()
        LIMIT 1;

        IF v_comment_author_id IS NULL THEN
          v_comment_author_id := v_author_id;
        END IF;

        v_comment_end_at := LEAST(
          public.random_timestamptz_on_date(target_date, 23, 23),
          v_updated_at + INTERVAL '3 hours'
        );
        v_comment_end_at := GREATEST(v_comment_end_at, v_created_at + INTERVAL '5 minutes');

        v_comment_created_at := public.random_timestamptz_between(v_created_at + INTERVAL '2 minutes', v_comment_end_at);

        INSERT INTO public.handover_note_comments (
          note_id,
          author_id,
          content,
          created_at
        ) VALUES (
          v_note_id,
          v_comment_author_id,
          public.random_choice(ARRAY[
            'Acknowledged. I will carry this into the next shift briefing.',
            'Update noted. Action owner confirmed and timeline is in progress.',
            'Thanks for logging this clearly. I will post closure notes after follow-up.',
            'Checked this item. Escalating to duty manager for faster resolution.',
            'Received. Team has been informed and handover checklist updated.'
          ]::TEXT[]),
          v_comment_created_at
        );

        v_note_comments_count := v_note_comments_count + 1;
      END LOOP;
    END IF;

    v_notes_count := v_notes_count + 1;
  END LOOP;

  -- Complaints
  FOR i IN 1..v_complaint_target LOOP
    SELECT id, department_id
      INTO v_author_id, v_department_id
    FROM public.profiles
    WHERE is_active = true
    ORDER BY random()
    LIMIT 1;

    IF v_author_id IS NULL THEN
      EXIT;
    END IF;

    SELECT id INTO v_assigned_to
    FROM public.profiles
    WHERE is_active = true
      AND (v_department_id IS NULL OR department_id = v_department_id)
    ORDER BY random()
    LIMIT 1;

    v_roll := random();
    IF v_roll < 0.2 THEN
      v_priority := 'urgent';
    ELSIF v_roll < 0.8 THEN
      v_priority := 'normal';
    ELSE
      v_priority := 'low';
    END IF;

    IF target_date < CURRENT_DATE THEN
      v_status := CASE WHEN random() < 0.4 THEN 'resolved' ELSE 'open' END;
    ELSE
      v_status := CASE WHEN random() < 0.12 THEN 'resolved' ELSE 'open' END;
    END IF;

    IF v_status = 'resolved' THEN
      SELECT id INTO v_resolved_by
      FROM public.profiles
      WHERE is_active = true
      ORDER BY random()
      LIMIT 1;
    ELSE
      v_resolved_by := NULL;
    END IF;

    v_complaint_title := public.random_choice(ARRAY[
      'Room temperature not comfortable',
      'Noise disturbance during quiet hours',
      'Housekeeping response delay',
      'Billing clarification requested',
      'Wi-Fi reliability concern',
      'Restaurant service wait time',
      'Bathroom fixture issue',
      'Check-in queue dissatisfaction'
    ]::TEXT[]);

    v_complaint_description := public.random_choice(ARRAY[
      'Guest reported this issue and requested prompt follow-up from duty staff.',
      'Details were collected at front desk and passed to the responsible department.',
      'Complaint logged with initial triage. Please update timeline after first contact.',
      'Team should provide progress update and confirm guest communication once handled.',
      'Operational impact is moderate and should be resolved within this shift window.'
    ]::TEXT[]);

    v_created_at := public.random_timestamptz_on_date(target_date, 6, 23);
    v_updated_at := public.random_timestamptz_between(v_created_at + INTERVAL '15 minutes', v_created_at + INTERVAL '8 hours');

    INSERT INTO public.complaints (
      title,
      description,
      guest_name,
      room_number,
      status,
      priority,
      created_by,
      assigned_to,
      department_id,
      resolved_at,
      resolved_by,
      created_at,
      updated_at
    ) VALUES (
      v_complaint_title,
      v_complaint_description,
      public.random_choice(ARRAY['John Carter', 'Amelia Stone', 'Noah Reed', 'Sophia Lane', 'Daniel Park', 'Olivia Hart']::TEXT[]),
      LPAD((100 + FLOOR(random() * 60)::INTEGER)::TEXT, 3, '0'),
      v_status,
      v_priority,
      v_author_id,
      v_assigned_to,
      v_department_id,
      CASE WHEN v_status = 'resolved' THEN v_updated_at ELSE NULL END,
      v_resolved_by,
      v_created_at,
      v_updated_at
    ) RETURNING id INTO v_complaint_id;

    IF v_complaint_id IS NOT NULL AND random() < 0.7 THEN
      FOR j IN 1..(1 + FLOOR(random() * 2)::INTEGER) LOOP
        SELECT id INTO v_tag_id
        FROM public.complaint_tags
        ORDER BY random()
        LIMIT 1;

        IF v_tag_id IS NOT NULL THEN
          INSERT INTO public.complaint_tag_mappings (complaint_id, tag_id)
          VALUES (v_complaint_id, v_tag_id)
          ON CONFLICT (complaint_id, tag_id) DO NOTHING;
        END IF;
      END LOOP;
    END IF;

    IF v_complaint_id IS NOT NULL AND random() < 0.86 THEN
      v_comment_count := 1 + FLOOR(random() * 3)::INTEGER;

      FOR j IN 1..v_comment_count LOOP
        SELECT id
        INTO v_comment_author_id
        FROM public.profiles
        WHERE is_active = true
          AND (
            id = v_author_id
            OR id = v_assigned_to
            OR role IN ('admin', 'manager')
            OR (v_department_id IS NOT NULL AND department_id = v_department_id)
          )
        ORDER BY random()
        LIMIT 1;

        IF v_comment_author_id IS NULL THEN
          v_comment_author_id := v_author_id;
        END IF;

        v_comment_end_at := CASE
          WHEN v_status = 'resolved' THEN v_updated_at
          ELSE v_updated_at + INTERVAL '6 hours'
        END;
        v_comment_end_at := GREATEST(v_comment_end_at, v_created_at + INTERVAL '6 minutes');

        v_comment_created_at := public.random_timestamptz_between(v_created_at + INTERVAL '3 minutes', v_comment_end_at);

        INSERT INTO public.complaint_comments (
          complaint_id,
          author_id,
          content,
          created_at
        ) VALUES (
          v_complaint_id,
          v_comment_author_id,
          public.random_choice(ARRAY[
            'Guest contacted and updated. Awaiting confirmation after corrective action.',
            'Acknowledged. Assigned team has started handling this now.',
            'Initial checks completed; posting another update after service recovery.',
            'Escalated to duty manager due to guest impact and urgency.',
            'Follow-up logged. Please confirm resolution before close of shift.'
          ]::TEXT[]),
          v_comment_created_at
        );

        v_complaint_comments_count := v_complaint_comments_count + 1;
      END LOOP;
    END IF;

    v_complaints_count := v_complaints_count + 1;
  END LOOP;

  -- Issues
  FOR i IN 1..v_issue_target LOOP
    SELECT id INTO v_author_id
    FROM public.profiles
    WHERE is_active = true
    ORDER BY random()
    LIMIT 1;

    IF v_author_id IS NULL THEN
      EXIT;
    END IF;

    v_roll := random();
    IF v_roll < 0.18 THEN
      v_priority := 'urgent';
    ELSIF v_roll < 0.78 THEN
      v_priority := 'normal';
    ELSE
      v_priority := 'low';
    END IF;

    IF target_date < CURRENT_DATE THEN
      v_status := CASE WHEN random() < 0.35 THEN 'resolved' ELSE 'open' END;
    ELSE
      v_status := CASE WHEN random() < 0.1 THEN 'resolved' ELSE 'open' END;
    END IF;

    IF v_status = 'resolved' THEN
      SELECT id INTO v_resolved_by
      FROM public.profiles
      WHERE is_active = true
      ORDER BY random()
      LIMIT 1;
    ELSE
      v_resolved_by := NULL;
    END IF;

    v_issue_title := public.random_choice(ARRAY[
      'Door lock requires technician check',
      'Laundry machine cycle interruption',
      'Lighting fault in corridor section',
      'POS terminal intermittent disconnect',
      'Elevator call button inconsistency',
      'Water pressure fluctuation reported'
    ]::TEXT[]);

    v_issue_description := public.random_choice(ARRAY[
      'Issue reported by staff and requires technical review.',
      'Temporary workaround in place; permanent fix should be scheduled.',
      'Please validate impact and confirm if guest-facing services are affected.',
      'Engineering follow-up required with completion note for next shift.'
    ]::TEXT[]);

    v_created_at := public.random_timestamptz_on_date(target_date, 0, 23);
    v_updated_at := public.random_timestamptz_between(v_created_at + INTERVAL '20 minutes', v_created_at + INTERVAL '7 hours');

    INSERT INTO public.issues (
      title,
      description,
      status,
      priority,
      resolved_by,
      resolved_at,
      created_by,
      created_at,
      updated_at
    ) VALUES (
      v_issue_title,
      v_issue_description,
      v_status,
      v_priority,
      v_resolved_by,
      CASE WHEN v_status = 'resolved' THEN v_updated_at ELSE NULL END,
      v_author_id,
      v_created_at,
      v_updated_at
    ) RETURNING id INTO v_issue_id;

    IF v_issue_id IS NOT NULL AND random() < 0.84 THEN
      v_comment_count := 1 + FLOOR(random() * 3)::INTEGER;

      FOR j IN 1..v_comment_count LOOP
        SELECT id
        INTO v_comment_author_id
        FROM public.profiles
        WHERE is_active = true
          AND (
            id = v_author_id
            OR id = v_resolved_by
            OR role IN ('admin', 'manager')
          )
        ORDER BY random()
        LIMIT 1;

        IF v_comment_author_id IS NULL THEN
          v_comment_author_id := v_author_id;
        END IF;

        v_comment_end_at := CASE
          WHEN v_status = 'resolved' THEN v_updated_at
          ELSE v_updated_at + INTERVAL '4 hours'
        END;
        v_comment_end_at := GREATEST(v_comment_end_at, v_created_at + INTERVAL '8 minutes');

        v_comment_created_at := public.random_timestamptz_between(v_created_at + INTERVAL '4 minutes', v_comment_end_at);

        INSERT INTO public.issue_comments (
          issue_id,
          author_id,
          content,
          created_at
        ) VALUES (
          v_issue_id,
          v_comment_author_id,
          public.random_choice(ARRAY[
            'Issue acknowledged. Engineering queue updated with priority and owner.',
            'Diagnostic step completed; waiting on parts / access confirmation.',
            'Temporary workaround is active. Permanent fix still in progress.',
            'Safety check completed. Posting final verification shortly.',
            'Team informed. Will close once validation is confirmed on site.'
          ]::TEXT[]),
          v_comment_created_at
        );

        v_issue_comments_count := v_issue_comments_count + 1;
      END LOOP;
    END IF;

    v_issues_count := v_issues_count + 1;
  END LOOP;

  -- Schedule tasks
  FOR i IN 1..v_task_target LOOP
    SELECT id, department_id
      INTO v_assigned_to, v_department_id
    FROM public.profiles
    WHERE is_active = true
      AND department_id IS NOT NULL
    ORDER BY random()
    LIMIT 1;

    IF v_assigned_to IS NULL OR v_department_id IS NULL THEN
      EXIT;
    END IF;

    SELECT id INTO v_created_by
    FROM public.profiles
    WHERE is_active = true
      AND role IN ('admin', 'manager')
    ORDER BY random()
    LIMIT 1;

    IF v_created_by IS NULL THEN
      v_created_by := v_assigned_to;
    END IF;

    v_due_time := public.random_choice(ARRAY['08:30'::TIME, '10:00'::TIME, '12:00'::TIME, '15:00'::TIME, '18:00'::TIME]);

    v_roll := random();
    IF target_date < CURRENT_DATE THEN
      IF v_roll < 0.55 THEN
        v_status := 'completed';
      ELSIF v_roll < 0.8 THEN
        v_status := 'in_progress';
      ELSE
        v_status := 'pending';
      END IF;
    ELSE
      IF v_roll < 0.2 THEN
        v_status := 'in_progress';
      ELSE
        v_status := 'pending';
      END IF;
    END IF;

    v_roll := random();
    IF v_roll < 0.14 THEN
      v_priority := 'urgent';
    ELSIF v_roll < 0.75 THEN
      v_priority := 'normal';
    ELSE
      v_priority := 'low';
    END IF;

    v_task_title := public.random_choice(ARRAY[
      'Prepare VIP arrival setup',
      'Verify room readiness checklist',
      'Complete lobby presentation walk-through',
      'Review minibar replenishment report',
      'Confirm event room staging',
      'Coordinate luggage assistance coverage',
      'Validate breakfast service handover'
    ]::TEXT[]);

    v_task_description := public.random_choice(ARRAY[
      'Track completion and leave a short update for the next team.',
      'Coordinate with relevant department and mark blockers if any.',
      'This task supports daily service continuity and guest experience.',
      'Confirm handoff quality and close before shift end where possible.'
    ]::TEXT[]);

    v_created_at := (
      target_date::TIMESTAMP
      + make_interval(hours => FLOOR(random() * 10)::INTEGER, mins => FLOOR(random() * 60)::INTEGER)
    ) AT TIME ZONE 'UTC';

    v_updated_at := v_created_at + make_interval(mins => 10 + FLOOR(random() * 240)::INTEGER);

    INSERT INTO public.schedule_tasks (
      title,
      description,
      assigned_to,
      department_id,
      due_date,
      due_time,
      priority,
      status,
      acknowledged,
      acknowledged_at,
      completed_at,
      created_by,
      created_at,
      updated_at
    ) VALUES (
      v_task_title,
      v_task_description,
      v_assigned_to,
      v_department_id,
      target_date,
      v_due_time,
      v_priority,
      v_status,
      CASE WHEN v_status IN ('in_progress', 'completed') THEN true ELSE false END,
      CASE WHEN v_status IN ('in_progress', 'completed') THEN v_created_at + make_interval(mins => 15) ELSE NULL END,
      CASE WHEN v_status = 'completed' THEN v_updated_at ELSE NULL END,
      v_created_by,
      v_created_at,
      v_updated_at
    );

    v_tasks_count := v_tasks_count + 1;
  END LOOP;

  -- Shifts (up to one shift per active staff member for the target day)
  FOR v_staff IN
    SELECT id, department_id
    FROM public.profiles
    WHERE is_active = true
      AND department_id IS NOT NULL
  LOOP
    IF random() > 0.8 THEN
      CONTINUE;
    END IF;

    v_roll := random();
    IF v_roll < 0.25 THEN
      v_start_time := '07:00'::TIME;
      v_end_time := '15:00'::TIME;
    ELSIF v_roll < 0.55 THEN
      v_start_time := '09:00'::TIME;
      v_end_time := '17:00'::TIME;
    ELSIF v_roll < 0.85 THEN
      v_start_time := '14:00'::TIME;
      v_end_time := '22:00'::TIME;
    ELSE
      v_start_time := '22:00'::TIME;
      v_end_time := '06:00'::TIME;
    END IF;

    v_roll := random();
    IF v_roll < 0.85 THEN
      v_shift_type := 'regular';
    ELSIF v_roll < 0.95 THEN
      v_shift_type := 'overtime';
    ELSE
      v_shift_type := 'on-call';
    END IF;

    SELECT id INTO v_created_by
    FROM public.profiles
    WHERE is_active = true
      AND role IN ('admin', 'manager')
    ORDER BY random()
    LIMIT 1;

    v_created_at := (
      target_date::TIMESTAMP
      + make_interval(hours => 1 + FLOOR(random() * 5)::INTEGER, mins => FLOOR(random() * 60)::INTEGER)
    ) AT TIME ZONE 'UTC';

    INSERT INTO public.shifts (
      staff_id,
      department_id,
      shift_date,
      start_time,
      end_time,
      shift_type,
      notes,
      acknowledged,
      acknowledged_at,
      created_by,
      created_at,
      updated_at
    ) VALUES (
      v_staff.id,
      v_staff.department_id,
      target_date,
      v_start_time,
      v_end_time,
      v_shift_type,
      public.random_choice(ARRAY[
        'Cover early guest arrivals and coordinate front-desk handoff.',
        'Support peak check-out window and maintain service pace.',
        'Prioritize guest-facing requests flagged as urgent in notes.',
        'Coordinate closely with duty manager for escalations.'
      ]::TEXT[]),
      CASE WHEN target_date < CURRENT_DATE AND random() < 0.75 THEN true ELSE false END,
      CASE WHEN target_date < CURRENT_DATE AND random() < 0.75 THEN v_created_at + make_interval(hours => 2) ELSE NULL END,
      v_created_by,
      v_created_at,
      v_created_at + make_interval(mins => 20)
    );

    v_shifts_count := v_shifts_count + 1;
  END LOOP;

  -- Events + attendees
  FOR i IN 1..v_event_target LOOP
    IF random() < 0.3 THEN
      v_event_department := NULL;
    ELSE
      SELECT id INTO v_event_department
      FROM public.departments
      ORDER BY random()
      LIMIT 1;
    END IF;

    v_event_title := public.random_choice(ARRAY[
      'Morning operations sync',
      'Service quality checkpoint',
      'Safety walkthrough',
      'VIP arrival preparation',
      'Department huddle'
    ]::TEXT[]);

    v_event_description := public.random_choice(ARRAY[
      'Short coordination session to align priorities and blockers.',
      'Review service outcomes and confirm ownership for pending items.',
      'Operational meeting focused on next-shift readiness and risks.'
    ]::TEXT[]);

    SELECT id INTO v_created_by
    FROM public.profiles
    WHERE is_active = true
      AND role IN ('admin', 'manager')
    ORDER BY random()
    LIMIT 1;

    v_start_time := public.random_choice(ARRAY['09:00'::TIME, '11:00'::TIME, '14:00'::TIME, '16:00'::TIME]);
    v_end_time := v_start_time + INTERVAL '1 hour';

    v_created_at := (
      target_date::TIMESTAMP
      + make_interval(hours => FLOOR(random() * 8)::INTEGER, mins => FLOOR(random() * 60)::INTEGER)
    ) AT TIME ZONE 'UTC';

    INSERT INTO public.schedule_events (
      title,
      description,
      department_id,
      event_date,
      start_time,
      end_time,
      event_type,
      location,
      created_by,
      created_at,
      updated_at
    ) VALUES (
      v_event_title,
      v_event_description,
      v_event_department,
      target_date,
      v_start_time,
      v_end_time,
      public.random_choice(ARRAY['meeting', 'training', 'inspection', 'vip', 'other']::TEXT[]),
      public.random_choice(ARRAY['Ops Room', 'Front Desk', 'Back Office', 'Service Corridor', 'Conference Room']::TEXT[]),
      v_created_by,
      v_created_at,
      v_created_at + make_interval(mins => 30)
    ) RETURNING id INTO v_event_id;

    IF v_event_id IS NOT NULL THEN
      INSERT INTO public.event_attendees (
        event_id,
        staff_id,
        acknowledged,
        acknowledged_at
      )
      SELECT
        v_event_id,
        p.id,
        CASE
          WHEN target_date < CURRENT_DATE THEN random() < 0.85
          ELSE random() < 0.35
        END,
        CASE
          WHEN target_date < CURRENT_DATE THEN v_created_at + make_interval(hours => 1)
          ELSE NULL
        END
      FROM public.profiles p
      WHERE p.is_active = true
        AND (v_event_department IS NULL OR p.department_id = v_event_department)
      ORDER BY random()
      LIMIT (2 + FLOOR(random() * 4)::INTEGER)
      ON CONFLICT (event_id, staff_id) DO NOTHING;

      GET DIAGNOSTICS v_inserted_rows = ROW_COUNT;
      v_attendees_count := v_attendees_count + v_inserted_rows;
    END IF;

    v_events_count := v_events_count + 1;
  END LOOP;

  -- Notifications
  FOR i IN 1..v_notification_target LOOP
    SELECT id INTO v_created_by
    FROM public.profiles
    WHERE is_active = true
      AND role IN ('admin', 'manager')
    ORDER BY random()
    LIMIT 1;

    v_roll := random();
    IF v_roll < 0.15 THEN
      v_priority := 'urgent';
    ELSIF v_roll < 0.8 THEN
      v_priority := 'normal';
    ELSE
      v_priority := 'low';
    END IF;

    v_notification_title := public.random_choice(ARRAY[
      'Shift coverage update',
      'Service reminder for all teams',
      'Operations note from management',
      'Daily guest-experience focus',
      'Coordination update for evening handover'
    ]::TEXT[]);

    v_notification_content := public.random_choice(ARRAY[
      'Please review priorities in your dashboard and acknowledge key updates.',
      'Focus on response time and service consistency during the current shift.',
      'Escalate blockers early to keep cross-department operations smooth.',
      'Thank you for closing open items before handover where possible.'
    ]::TEXT[]);

    v_created_at := (
      target_date::TIMESTAMP
      + make_interval(hours => FLOOR(random() * 24)::INTEGER, mins => FLOOR(random() * 60)::INTEGER)
    ) AT TIME ZONE 'UTC';

    INSERT INTO public.notifications (
      title,
      content,
      priority,
      created_by,
      created_at,
      updated_at
    ) VALUES (
      v_notification_title,
      v_notification_content,
      v_priority,
      v_created_by,
      v_created_at,
      v_created_at + make_interval(mins => 10)
    );

    v_notifications_count := v_notifications_count + 1;
  END LOOP;

  v_counts := jsonb_build_object(
    'handover_notes', v_notes_count,
    'handover_note_comments', v_note_comments_count,
    'complaints', v_complaints_count,
    'complaint_comments', v_complaint_comments_count,
    'issues', v_issues_count,
    'issue_comments', v_issue_comments_count,
    'schedule_tasks', v_tasks_count,
    'shifts', v_shifts_count,
    'schedule_events', v_events_count,
    'event_attendees', v_attendees_count,
    'notifications', v_notifications_count
  );

  INSERT INTO public.demo_seed_runs (seed_date, seed_type, counts)
  VALUES (target_date, v_seed_type, v_counts);

  RETURN jsonb_build_object(
    'ok', true,
    'seed_date', target_date,
    'seed_type', v_seed_type,
    'skipped', false,
    'counts', v_counts
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.seed_demo_baseline()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_settings public.demo_seed_settings%ROWTYPE;
  v_default_department_id UUID;
  v_start_date DATE;
  v_day DATE;
  v_result JSONB;
  v_seeded_days INTEGER := 0;
  v_skipped_days INTEGER := 0;
BEGIN
  SELECT * INTO v_settings
  FROM public.demo_seed_settings
  WHERE singleton = true;

  IF NOT FOUND THEN
    INSERT INTO public.demo_seed_settings (singleton)
    VALUES (true)
    ON CONFLICT (singleton) DO NOTHING;

    SELECT * INTO v_settings
    FROM public.demo_seed_settings
    WHERE singleton = true;
  END IF;

  IF NOT v_settings.enabled THEN
    RETURN jsonb_build_object(
      'ok', true,
      'skipped', true,
      'reason', 'demo_seed_disabled'
    );
  END IF;

  -- Baseline master data
  INSERT INTO public.departments (name, description)
  VALUES
    ('Front Desk', 'Reception, arrivals, departures, and guest support'),
    ('Housekeeping', 'Room standards, linen operations, and cleaning workflow'),
    ('Food & Beverage', 'Restaurant and bar service operations'),
    ('Engineering', 'Maintenance, repairs, and safety checks'),
    ('Management', 'Duty management and administration')
  ON CONFLICT (name) DO UPDATE
  SET description = EXCLUDED.description;

  SELECT id
  INTO v_default_department_id
  FROM public.departments
  WHERE name = 'Front Desk'
  LIMIT 1;

  IF v_default_department_id IS NOT NULL THEN
    UPDATE public.profiles
    SET department_id = v_default_department_id,
        updated_at = NOW()
    WHERE is_active = true
      AND department_id IS NULL;
  END IF;

  INSERT INTO public.categories (name, color)
  VALUES
    ('Guest Issue', '#ef4444'),
    ('Maintenance', '#f59e0b'),
    ('VIP', '#8b5cf6'),
    ('General', '#6b7280'),
    ('Housekeeping', '#10b981'),
    ('Restaurant', '#3b82f6'),
    ('Security', '#0f766e'),
    ('Operations', '#1d4ed8')
  ON CONFLICT (name) DO UPDATE
  SET color = EXCLUDED.color;

  INSERT INTO public.complaint_tags (name, color)
  VALUES
    ('Maintenance Issue', '#ef4444'),
    ('Price', '#f59e0b'),
    ('Staff', '#3b82f6'),
    ('Cleanliness', '#8b5cf6'),
    ('Noise', '#ec4899'),
    ('Service', '#10b981'),
    ('Food & Beverage', '#f97316'),
    ('Amenities', '#06b6d4')
  ON CONFLICT (name) DO UPDATE
  SET color = EXCLUDED.color;

  INSERT INTO public.resources (title, content, category, created_at, updated_at)
  SELECT
    s.title,
    s.content,
    s.category,
    NOW(),
    NOW()
  FROM (
    VALUES
      ('Guest Recovery Checklist', '1) Acknowledge immediately. 2) Confirm facts. 3) Offer next step and timing. 4) Log follow-up in system.', 'Front Desk'),
      ('Escalation Matrix', 'Urgent guest-impacting issues escalate to duty manager within 10 minutes. Document owner and ETA.', 'Policies'),
      ('Room Readiness Standard', 'Verify cleanliness, minibar, amenities, and climate before releasing room status as ready.', 'Housekeeping'),
      ('Maintenance Triage Guide', 'Classify requests as safety-critical, guest-impacting, or planned. Record first response time.', 'Engineering'),
      ('Shift Handover Standard', 'Every shift must log pending items, blockers, and ownership to ensure continuity.', 'Operations')
  ) AS s(title, content, category)
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.resources r
    WHERE r.title = s.title
  );

  INSERT INTO public.notifications (title, content, priority, created_at, updated_at)
  SELECT
    s.title,
    s.content,
    s.priority,
    NOW() - s.offset_interval,
    NOW() - s.offset_interval
  FROM (
    VALUES
      ('Welcome to the Demo Sandbox', 'This environment includes synthetic operational data for realistic walkthroughs.', 'normal', INTERVAL '2 days'),
      ('Operational Demo Mode', 'Daily sandbox data is generated automatically to keep dashboards active and up to date.', 'normal', INTERVAL '1 day'),
      ('Escalation Reminder', 'Urgent guest-impacting incidents must be acknowledged quickly and logged clearly.', 'urgent', INTERVAL '12 hours')
  ) AS s(title, content, priority, offset_interval)
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.notifications n
    WHERE n.title = s.title
  );

  -- Backfill recent days, including today
  v_start_date := CURRENT_DATE - v_settings.days_to_backfill;

  FOR v_day IN
    SELECT generate_series(v_start_date::TIMESTAMP, CURRENT_DATE::TIMESTAMP, INTERVAL '1 day')::DATE
  LOOP
    v_result := public.seed_demo_day(v_day, 'baseline');

    IF COALESCE((v_result ->> 'skipped')::BOOLEAN, false) THEN
      v_skipped_days := v_skipped_days + 1;
    ELSE
      v_seeded_days := v_seeded_days + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'ok', true,
    'seeded_days', v_seeded_days,
    'skipped_days', v_skipped_days,
    'from_date', v_start_date,
    'to_date', CURRENT_DATE,
    'timezone', v_settings.business_timezone
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.run_scheduled_demo_seed()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_settings public.demo_seed_settings%ROWTYPE;
  v_local_now TIMESTAMP;
  v_result JSONB;
BEGIN
  SELECT * INTO v_settings
  FROM public.demo_seed_settings
  WHERE singleton = true;

  IF NOT FOUND THEN
    INSERT INTO public.demo_seed_settings (singleton)
    VALUES (true)
    ON CONFLICT (singleton) DO NOTHING;

    SELECT * INTO v_settings
    FROM public.demo_seed_settings
    WHERE singleton = true;
  END IF;

  IF NOT v_settings.enabled THEN
    RETURN jsonb_build_object(
      'ok', true,
      'skipped', true,
      'reason', 'demo_seed_disabled'
    );
  END IF;

  v_local_now := NOW() AT TIME ZONE v_settings.business_timezone;

  -- Intended for hourly cron: only seed when local hour is midnight.
  IF EXTRACT(HOUR FROM v_local_now) <> 0 THEN
    RETURN jsonb_build_object(
      'ok', true,
      'skipped', true,
      'reason', 'not_midnight_in_business_timezone',
      'timezone', v_settings.business_timezone,
      'local_timestamp', v_local_now
    );
  END IF;

  v_result := public.seed_demo_day(v_local_now::DATE, 'daily');

  RETURN v_result || jsonb_build_object(
    'timezone', v_settings.business_timezone,
    'local_timestamp', v_local_now
  );
END;
$$;
