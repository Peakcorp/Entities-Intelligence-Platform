-- Seeds the four business entities, plus realistic SupplyX demo data so the dashboard
-- has something to show. Owner accounts (Eli Tene, Gil Priel) are created via
-- Supabase Auth invite (see docs/OWNER_SETUP.md) and are not seeded here since auth.users
-- rows require the auth admin API, not a plain SQL insert.
-- (v2: email_connections/chat_sessions.user_id is now nullable — see migration 0007)

insert into entities (slug, name, business_type, status, config) values
  ('supplyx', 'SupplyX Inc', 'Procurement of building materials, FF&E, renovation materials', 'active', '{}'),
  ('peak-foreclosure', 'Peak Foreclosure', 'Real estate foreclosure operations', 'placeholder', '{}'),
  ('peak-1031-exchange', 'Peak 1031 Exchange', 'Tax-deferred real estate exchange services', 'placeholder', '{}'),
  ('grand-investment-group', 'Grand Investment Group', 'Investment group operations', 'placeholder', '{}')
on conflict (slug) do nothing;

-- ============================================================================
-- SupplyX demo data — a fictional snapshot so every dashboard section renders
-- with realistic content. Safe to delete: `delete from manufacturers where
-- entity_id = (select id from entities where slug = 'supplyx');` cascades to
-- scorecards/deals/orders/emails/analyses/satisfaction rows via FKs.
-- ============================================================================

do $$
declare
  v_entity_id uuid;
  v_conn_lee uuid;
  v_conn_michael uuid;

  v_mfg_tile uuid;
  v_mfg_marble uuid;
  v_mfg_fixtures uuid;
  v_mfg_textiles uuid;
  v_mfg_cabinetry uuid;

  v_client_apex uuid;
  v_client_harbor uuid;
  v_client_pacific uuid;
  v_client_sunrise uuid;
  v_client_meridian uuid;

  v_deal_apex_1 uuid;
  v_deal_apex_2 uuid;
  v_deal_harbor_1 uuid;
  v_deal_pacific_1 uuid;
  v_deal_sunrise_1 uuid;
  v_deal_sunrise_2 uuid;
  v_deal_meridian_1 uuid;
  v_deal_meridian_2 uuid;

  v_email_1 uuid;
  v_email_2 uuid;
  v_email_3 uuid;
  v_email_4 uuid;
  v_email_5 uuid;
  v_email_6 uuid;
  v_email_7 uuid;
  v_email_8 uuid;

  v_session_1 uuid;
begin
  select id into v_entity_id from entities where slug = 'supplyx';

  -- Skip entirely if this looks already-seeded (re-running db push shouldn't duplicate).
  if exists (select 1 from manufacturers where entity_id = v_entity_id) then
    return;
  end if;

  -- Email connections (sync_status is illustrative; no OAuth tokens exist yet).
  insert into email_connections (id, entity_id, user_id, email_address, provider, sync_status, last_synced_at)
  values
    (gen_random_uuid(), v_entity_id, null, 'lee@supplyx.io', 'microsoft', 'ok', now() - interval '12 minutes')
  returning id into v_conn_lee;

  insert into email_connections (id, entity_id, user_id, email_address, provider, sync_status, last_synced_at)
  values
    (gen_random_uuid(), v_entity_id, null, 'michael@supplyx.io', 'microsoft', 'ok', now() - interval '8 minutes')
  returning id into v_conn_michael;

  -- Manufacturers
  insert into manufacturers (id, entity_id, name, country, region, product_categories) values
    (gen_random_uuid(), v_entity_id, 'Guangzhou Elite Tile Co.', 'China', 'Guangdong', array['Tile', 'Flooring'])
    returning id into v_mfg_tile;
  insert into manufacturers (id, entity_id, name, country, region, product_categories) values
    (gen_random_uuid(), v_entity_id, 'Milano Marble Works', 'Italy', 'Lombardy', array['Marble', 'Countertops'])
    returning id into v_mfg_marble;
  insert into manufacturers (id, entity_id, name, country, region, product_categories) values
    (gen_random_uuid(), v_entity_id, 'Pacific Rim Fixtures', 'Vietnam', 'Ho Chi Minh City', array['Plumbing Fixtures', 'Hardware'])
    returning id into v_mfg_fixtures;
  insert into manufacturers (id, entity_id, name, country, region, product_categories) values
    (gen_random_uuid(), v_entity_id, 'Anatolia Textiles Group', 'Turkey', 'Istanbul', array['Textiles', 'Window Treatments'])
    returning id into v_mfg_textiles;
  insert into manufacturers (id, entity_id, name, country, region, product_categories) values
    (gen_random_uuid(), v_entity_id, 'American Heritage Cabinetry', 'United States', 'North Carolina', array['Cabinetry', 'Millwork'])
    returning id into v_mfg_cabinetry;

  -- Manufacturer scorecards (last 90 days). Cabinetry has a manual override to show the badge.
  insert into manufacturer_scorecards (
    manufacturer_id, entity_id, period_start, period_end,
    ai_responsiveness, ai_quality, ai_price, ai_reliability,
    manual_responsiveness, manual_quality, manual_price, manual_reliability,
    team_notes, flagged_issues
  ) values
    (v_mfg_tile, v_entity_id, current_date - 90, current_date, 8.6, 9.1, 7.8, 8.9, null, null, null, null,
      null, '{}'),
    (v_mfg_marble, v_entity_id, current_date - 90, current_date, 6.2, 9.4, 5.1, 7.3, null, null, null, null,
      'Beautiful product but slow to quote. Confirm lead times before promising clients.', array['Slow response on RFQs']),
    (v_mfg_fixtures, v_entity_id, current_date - 90, current_date, 8.9, 8.2, 9.0, 8.4, null, null, null, null,
      null, '{}'),
    (v_mfg_textiles, v_entity_id, current_date - 90, current_date, 5.4, 6.8, 8.1, 5.9, null, null, null, null,
      'Two damaged shipments this quarter. Watching closely.', array['Damaged goods on arrival', 'Inconsistent packaging']),
    (v_mfg_cabinetry, v_entity_id, current_date - 90, current_date, 8.0, 8.5, 6.9, 8.1, 9.0, 9.0, 7.0, 9.0,
      'Team override: their new account rep (as of August) has been excellent, ahead of what the AI score reflects.',
      '{}');

  -- Clients
  insert into clients (id, entity_id, name, company, contact_emails) values
    (gen_random_uuid(), v_entity_id, 'Dana Whitfield', 'Apex Construction Group', array['dana@apexconstructiongroup.com'])
    returning id into v_client_apex;
  insert into clients (id, entity_id, name, company, contact_emails) values
    (gen_random_uuid(), v_entity_id, 'Marcus Ito', 'Harbor View Development', array['marcus@harborviewdev.com'])
    returning id into v_client_harbor;
  insert into clients (id, entity_id, name, company, contact_emails) values
    (gen_random_uuid(), v_entity_id, 'Renee Calloway', 'Pacific Heights Renovations', array['renee@pacificheightsreno.com'])
    returning id into v_client_pacific;
  insert into clients (id, entity_id, name, company, contact_emails) values
    (gen_random_uuid(), v_entity_id, 'Theo Marsh', 'Sunrise Hospitality Group', array['theo@sunrisehospitality.com'])
    returning id into v_client_sunrise;
  insert into clients (id, entity_id, name, company, contact_emails) values
    (gen_random_uuid(), v_entity_id, 'Priya Nandan', 'Meridian Office Partners', array['priya@meridianoffice.com'])
    returning id into v_client_meridian;

  -- Deals across every pipeline stage
  insert into deals (id, entity_id, client_id, stage, deal_value, expected_close_date, outcome) values
    (gen_random_uuid(), v_entity_id, v_client_apex, 'delivered', 184500, current_date - 10, null) returning id into v_deal_apex_1;
  insert into deals (id, entity_id, client_id, stage, deal_value, expected_close_date, outcome) values
    (gen_random_uuid(), v_entity_id, v_client_apex, 'quote_sent', 96200, current_date + 21, null) returning id into v_deal_apex_2;
  insert into deals (id, entity_id, client_id, stage, deal_value, expected_close_date, outcome) values
    (gen_random_uuid(), v_entity_id, v_client_harbor, 'in_production', 342000, current_date + 14, null) returning id into v_deal_harbor_1;
  insert into deals (id, entity_id, client_id, stage, deal_value, expected_close_date, outcome) values
    (gen_random_uuid(), v_entity_id, v_client_pacific, 'negotiation', 58750, current_date + 30, null) returning id into v_deal_pacific_1;
  insert into deals (id, entity_id, client_id, stage, deal_value, expected_close_date, outcome) values
    (gen_random_uuid(), v_entity_id, v_client_sunrise, 'order_placed', 271000, current_date + 7, null) returning id into v_deal_sunrise_1;
  insert into deals (id, entity_id, client_id, stage, deal_value, expected_close_date, outcome) values
    (gen_random_uuid(), v_entity_id, v_client_sunrise, 'shipped', 128300, current_date + 3, null) returning id into v_deal_sunrise_2;
  insert into deals (id, entity_id, client_id, stage, deal_value, expected_close_date, outcome) values
    (gen_random_uuid(), v_entity_id, v_client_meridian, 'prospect', 45000, current_date + 45, null) returning id into v_deal_meridian_1;
  insert into deals (id, entity_id, client_id, stage, deal_value, expected_close_date, outcome) values
    (gen_random_uuid(), v_entity_id, v_client_meridian, 'lead', 22000, current_date + 60, null) returning id into v_deal_meridian_2;

  -- Orders for the deals far enough along to have one
  insert into orders (deal_id, manufacturer_id, items, shipping_method, tracking_number, origin_country, status) values
    (v_deal_apex_1, v_mfg_tile, '[{"item":"Porcelain floor tile","qty":1200,"unit":"sqft"}]', 'Ocean freight', 'MSCU7741205', 'China', 'delivered'),
    (v_deal_harbor_1, v_mfg_marble, '[{"item":"Calacatta countertop slabs","qty":18,"unit":"slabs"}]', 'Ocean freight', 'MEDU5521873', 'Italy', 'in_production'),
    (v_deal_sunrise_1, v_mfg_fixtures, '[{"item":"Bathroom fixture sets","qty":64,"unit":"sets"}]', 'Air freight', 'FDX88213741', 'Vietnam', 'confirmed'),
    (v_deal_sunrise_2, v_mfg_textiles, '[{"item":"Custom drapery","qty":40,"unit":"panels"}]', 'Ocean freight', 'CMAU4471902', 'Turkey', 'shipped');

  -- Emails: enough to populate the Email Intelligence Browser with realistic threads
  insert into emails (id, entity_id, connection_id, external_id, thread_id, subject, body_text, from_address, to_addresses, sent_at, is_processed) values
    (gen_random_uuid(), v_entity_id, v_conn_michael, 'msg-1001', 'thread-apex-1', 'Re: FF&E procurement - final walkthrough',
      'Really appreciate how smoothly the FF&E procurement went, we will definitely be coming back for the next phase.',
      'dana@apexconstructiongroup.com', array['michael@supplyx.io'], now() - interval '4 days', true)
    returning id into v_email_1;
  insert into emails (id, entity_id, connection_id, external_id, thread_id, subject, body_text, from_address, to_addresses, sent_at, is_processed) values
    (gen_random_uuid(), v_entity_id, v_conn_michael, 'msg-1002', 'thread-apex-2', 'Quote request - Phase 2 renovation materials',
      'Following up on the quote for phase 2. Can you confirm lead times for the marble countertops?',
      'dana@apexconstructiongroup.com', array['michael@supplyx.io'], now() - interval '2 days', true)
    returning id into v_email_2;
  insert into emails (id, entity_id, connection_id, external_id, thread_id, subject, body_text, from_address, to_addresses, sent_at, is_processed) values
    (gen_random_uuid(), v_entity_id, v_conn_lee, 'msg-1003', 'thread-harbor-1', 'Wrong items delivered - project delayed',
      'This is causing us serious delays. The tile specifications delivered do not match what we ordered.',
      'marcus@harborviewdev.com', array['lee@supplyx.io'], now() - interval '9 days', true)
    returning id into v_email_3;
  insert into emails (id, entity_id, connection_id, external_id, thread_id, subject, body_text, from_address, to_addresses, sent_at, is_processed) values
    (gen_random_uuid(), v_entity_id, v_conn_lee, 'msg-1004', 'thread-harbor-1', 'Re: Wrong items delivered - checking in',
      'Following up again - we have not heard back and this is now blocking our subcontractors.',
      'lee@supplyx.io', array['marcus@harborviewdev.com'], now() - interval '6 days', true)
    returning id into v_email_4;
  insert into emails (id, entity_id, connection_id, external_id, thread_id, subject, body_text, from_address, to_addresses, sent_at, is_processed) values
    (gen_random_uuid(), v_entity_id, v_conn_lee, 'msg-1005', 'thread-harbor-1', 'Re: Wrong items delivered - second follow-up',
      'Still no response since the 3rd. We need a resolution or we will need to reconsider this order.',
      'lee@supplyx.io', array['marcus@harborviewdev.com'], now() - interval '5 days', true)
    returning id into v_email_5;
  insert into emails (id, entity_id, connection_id, external_id, thread_id, subject, body_text, from_address, to_addresses, sent_at, is_processed) values
    (gen_random_uuid(), v_entity_id, v_conn_michael, 'msg-1006', 'thread-pacific-1', 'Q1 renovation season - checking availability',
      'One order placed this quarter. Wanted to check pricing ahead of our Q1 renovation season.',
      'renee@pacificheightsreno.com', array['michael@supplyx.io'], now() - interval '18 days', true)
    returning id into v_email_6;
  insert into emails (id, entity_id, connection_id, external_id, thread_id, subject, body_text, from_address, to_addresses, sent_at, is_processed) values
    (gen_random_uuid(), v_entity_id, v_conn_michael, 'msg-1007', 'thread-sunrise-1', 'Order confirmation - fixture sets',
      'Confirming the order for 64 bathroom fixture sets, air freight from Vietnam.',
      'michael@supplyx.io', array['theo@sunrisehospitality.com'], now() - interval '7 days', true)
    returning id into v_email_7;
  insert into emails (id, entity_id, connection_id, external_id, thread_id, subject, body_text, from_address, to_addresses, sent_at, is_processed) values
    (gen_random_uuid(), v_entity_id, v_conn_lee, 'msg-1008', 'thread-meridian-1', 'Introduction - Meridian Office Partners',
      'We were referred by Apex Construction and would like to discuss procurement for our upcoming office buildout.',
      'priya@meridianoffice.com', array['lee@supplyx.io'], now() - interval '3 days', true)
    returning id into v_email_8;

  -- AI analyses for each email
  insert into email_analyses (email_id, intent, pipeline_stage, sentiment, urgency_score, summary, extracted_entities, action_items, key_dates, confidence_score, model_used) values
    (v_email_1, 'satisfaction_feedback', 'delivered', 'positive', 2,
      'Client expressing high satisfaction with completed FF&E procurement and intent to return for phase 2.',
      '{"manufacturer":"Guangzhou Elite Tile Co.","client":"Apex Construction Group"}', '{}', '{}', 0.94, 'claude-3-haiku-20240307'),
    (v_email_2, 'quote_request', 'quote_sent', 'neutral', 4,
      'Client following up on phase 2 quote, asking about marble countertop lead times.',
      '{"manufacturer":"Milano Marble Works","client":"Apex Construction Group","item":"marble countertops"}',
      array['Confirm marble lead time with Milano Marble Works'], '{}', 0.88, 'claude-3-haiku-20240307'),
    (v_email_3, 'complaint', 'in_production', 'negative', 8,
      'Client reports incorrect tile specifications delivered, causing project delays.',
      '{"manufacturer":"Milano Marble Works","client":"Harbor View Development","issue":"wrong items delivered"}',
      array['Verify tile specification against original order', 'Arrange replacement shipment'], '{}', 0.91, 'claude-3-haiku-20240307'),
    (v_email_4, 'follow_up', 'in_production', 'negative', 9,
      'Internal follow-up sent to client after no response to the original complaint.', '{}', '{}', '{}', 0.85, 'claude-3-haiku-20240307'),
    (v_email_5, 'escalation', 'in_production', 'negative', 10,
      'Second follow-up with escalation language ("reconsider this order"); complaint remains unresolved.',
      '{}', array['Escalate to manager', 'Contact client by phone today'], '{}', 0.93, 'claude-3-5-sonnet-20241022'),
    (v_email_6, 'quote_request', 'lead', 'neutral', 3,
      'Client checking pricing ahead of Q1 renovation season; relationship transactional and stable.',
      '{"client":"Pacific Heights Renovations"}', '{}', '{"follow_up_needed":"2026-01-15"}', 0.82, 'claude-3-haiku-20240307'),
    (v_email_7, 'order_confirmation', 'order_placed', 'positive', 2,
      'Order confirmed for bathroom fixture sets, air freight from Vietnam.',
      '{"manufacturer":"Pacific Rim Fixtures","client":"Sunrise Hospitality Group"}', '{}',
      '{"promised_delivery":"2026-09-20"}', 0.9, 'claude-3-haiku-20240307'),
    (v_email_8, 'new_lead', 'lead', 'positive', 5,
      'New inbound lead referred by an existing client (Apex Construction), requesting an office buildout procurement discussion.',
      '{"client":"Meridian Office Partners","referred_by":"Apex Construction Group"}',
      array['Schedule intro call'], '{}', 0.87, 'claude-3-haiku-20240307');

  -- Client satisfaction assessments (spec section 05a examples)
  insert into client_satisfaction_assessments (
    entity_id, client_id, status, score, trend, narrative,
    positive_signals, negative_signals, open_issues, days_since_last_contact, recommended_action, confidence
  ) values
    (v_entity_id, v_client_apex, 'satisfied', 9.2, 'improving',
      'Apex Construction appears highly satisfied. They placed 3 orders this quarter — an increase from 1 in the prior quarter — and their most recent email (4 days ago) included: "Really appreciate how smoothly the FF&E procurement went, we will definitely be coming back for the next phase." No open complaints. Last contact: 4 days ago.',
      '["Quick, warm replies","Explicit praise for delivery","Repeat orders trending up","Referred a new contact (Meridian Office Partners)"]',
      '[]', '[]', 4, 'Ask for a referral or testimonial. Propose next phase / new project.', 0.93),
    (v_entity_id, v_client_harbor, 'needs_immediate_attention', 2.8, 'declining',
      'Harbor View shows serious warning signs. A complaint about incorrect tile specifications was raised 9 days ago ("Wrong items delivered - project delayed"). Lee sent follow-ups 6 and 5 days ago with no response, and the most recent email included escalation language ("we need a resolution... reconsider this order"). The complaint remains unresolved for 9 days.',
      '[]',
      '["Complaint unresolved for 9+ days","Two unanswered follow-ups","Escalation language used","No response despite repeated outreach"]',
      '["Incorrect tile specification delivered (thread-harbor-1), unresolved since first raised"]',
      5, 'Escalate to Eli or Gil immediately. A manager-level contact is required. Do not let this go another day.', 0.91),
    (v_entity_id, v_client_pacific, 'neutral', 6.0, 'stable',
      'Pacific Heights is transactionally stable. One order placed this quarter. Email tone is professional and task-focused with no strong positive or negative signals. Response times from both sides are normal. No complaints on file. Last contact: 18 days ago — consider a check-in ahead of their Q1 renovation season.',
      '["Professional, consistent communication"]', '["18 days since last contact"]', '[]', 18,
      'Send a relationship check-in. Share relevant new product availability.', 0.8),
    (v_entity_id, v_client_sunrise, 'satisfied', 8.1, 'stable',
      'Sunrise Hospitality is a steady, active account with two orders currently in flight (fixtures confirmed, drapery shipped). Communication has been prompt and straightforward with no issues raised.',
      '["Two concurrent active orders","Prompt confirmations","No complaints"]', '[]', '[]', 3,
      'Propose next phase / new project.', 0.85),
    (v_entity_id, v_client_meridian, 'neutral', 6.5, 'improving',
      'Meridian Office Partners is a new lead, referred by Apex Construction Group. Early signals are positive (a warm referral, proactive outreach) but there is not yet enough history to assess satisfaction with confidence.',
      '["Warm referral from an existing satisfied client","Proactively reached out"]', '[]', '[]', 3,
      'Schedule an intro call within the week to capitalize on the referral.', 0.6);

  -- A sample chat session so the AI Chat Interface has something to show
  insert into chat_sessions (id, entity_id, user_id, title) values
    (gen_random_uuid(), v_entity_id, null, 'Harbor View complaint status')
    returning id into v_session_1;

  insert into chat_messages (session_id, role, content, cited_email_ids) values
    (v_session_1, 'user', 'What''s the status of the Harbor View complaint?', '{}'),
    (v_session_1, 'assistant',
      'Harbor View Development raised a complaint on ' || to_char(now() - interval '9 days', 'Mon DD') ||
      ' about incorrect tile specifications ("Wrong items delivered - project delayed"). Lee followed up twice (' ||
      to_char(now() - interval '6 days', 'Mon DD') || ' and ' || to_char(now() - interval '5 days', 'Mon DD') ||
      ') with no response, and the most recent message used escalation language ("reconsider this order"). ' ||
      'This is now flagged Needs Immediate Attention — 9 days unresolved. Recommended action: escalate to a manager and call the client today.',
      array[v_email_3, v_email_4, v_email_5]);

  -- Activity log: a couple of realistic entries (manual scorecard override + connection)
  insert into activity_log (entity_id, user_id, action, target_table, target_id, before_value, after_value, note) values
    (v_entity_id, null, 'scorecard_manual_override', 'manufacturer_scorecards', v_mfg_cabinetry,
      '{"manual_responsiveness":null,"manual_quality":null,"manual_price":null,"manual_reliability":null}',
      '{"manual_responsiveness":9.0,"manual_quality":9.0,"manual_price":7.0,"manual_reliability":9.0}',
      'New account rep (as of August) has been excellent, ahead of what the AI score reflects.'),
    (v_entity_id, null, 'email_connection_added', 'email_connections', v_conn_lee, null,
      '{"email_address":"lee@supplyx.io","provider":"microsoft"}', null),
    (v_entity_id, null, 'email_connection_added', 'email_connections', v_conn_michael, null,
      '{"email_address":"michael@supplyx.io","provider":"microsoft"}', null);
end $$;
