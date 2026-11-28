"""
CloudScale — Professional PPTX Builder with embedded chart images
"""
import os
from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

ASSETS = r"d:\PROJECTS\AwsCloudScal\_ppt_assets"
OUTPUT = r"d:\PROJECTS\AwsCloudScal\CloudScale_Presentation.pptx"

prs = Presentation()
prs.slide_width  = Inches(13.333)
prs.slide_height = Inches(7.5)
BL = prs.slide_layouts[6]  # blank

# Theme Colors
C_BG      = RGBColor(15, 23, 42)
C_BG2     = RGBColor(30, 41, 59)
C_CARD    = RGBColor(51, 65, 85)
C_BLUE    = RGBColor(2, 132, 199)
C_CYAN    = RGBColor(14, 165, 233)
C_EMERALD = RGBColor(16, 185, 129)
C_AMBER   = RGBColor(245, 158, 11)
C_ROSE    = RGBColor(239, 68, 68)
C_PURPLE  = RGBColor(139, 92, 246)
C_WHITE   = RGBColor(255, 255, 255)
C_MUTED   = RGBColor(148, 163, 184)
C_NAVY    = RGBColor(15, 23, 42)
C_BORDER  = RGBColor(226, 232, 240)
C_LIGHT   = RGBColor(248, 250, 252)

def bg_dark(slide):
    r = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, prs.slide_width, prs.slide_height)
    r.fill.solid(); r.fill.fore_color.rgb = C_BG; r.line.fill.background()

def bg_light(slide):
    r = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, prs.slide_width, prs.slide_height)
    r.fill.solid(); r.fill.fore_color.rgb = C_LIGHT; r.line.fill.background()

def accent_bar(slide, x, y, w=1.2, color=C_CYAN):
    b = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(x), Inches(y), Inches(w), Inches(0.06))
    b.fill.solid(); b.fill.fore_color.rgb = color; b.line.fill.background()

def card(slide, x, y, w, h, bg=C_WHITE, border=C_BORDER):
    s = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(x), Inches(y), Inches(w), Inches(h))
    s.fill.solid(); s.fill.fore_color.rgb = bg
    if border: s.line.color.rgb = border; s.line.width = Pt(1)
    else: s.line.fill.background()
    return s

def pill(slide, x, y, text, color):
    s = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(x), Inches(y), Inches(1.8), Inches(0.38))
    s.fill.solid(); s.fill.fore_color.rgb = C_BG2
    s.line.color.rgb = color; s.line.width = Pt(1)
    tf = s.text_frame; tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    p = tf.paragraphs[0]; p.text = text; p.alignment = PP_ALIGN.CENTER
    p.font.size = Pt(9); p.font.bold = True; p.font.color.rgb = color

def heading(slide, tag, title, subtitle, dark=False):
    tc = C_WHITE if dark else C_NAVY
    mc = C_MUTED if not dark else RGBColor(100, 116, 139)
    
    tb = slide.shapes.add_textbox(Inches(0.8), Inches(0.35), Inches(11.7), Inches(1.1))
    tf = tb.text_frame; tf.word_wrap = True
    p = tf.paragraphs[0]; p.text = tag.upper()
    p.font.size = Pt(10); p.font.bold = True; p.font.color.rgb = C_BLUE; p.space_after = Pt(2)
    p = tf.add_paragraph(); p.text = title
    p.font.size = Pt(22); p.font.bold = True; p.font.color.rgb = tc; p.space_after = Pt(2)
    p = tf.add_paragraph(); p.text = subtitle
    p.font.size = Pt(11); p.font.color.rgb = mc

def add_img(slide, path, x, y, w, h=None):
    kw = {'left': Inches(x), 'top': Inches(y), 'width': Inches(w)}
    if h: kw['height'] = Inches(h)
    slide.shapes.add_picture(path, **kw)

def txt(slide, x, y, w, h, content, sz=11, bold=False, color=C_NAVY, align=PP_ALIGN.LEFT):
    tb = slide.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    tf = tb.text_frame; tf.word_wrap = True
    for i, line in enumerate(content if isinstance(content, list) else [content]):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.text = line; p.font.size = Pt(sz); p.font.bold = bold; p.font.color.rgb = color
        p.alignment = align; p.space_after = Pt(4)


# ═════════════════════════════════════════════════════════════
# SLIDE 1: DARK HERO TITLE
# ═════════════════════════════════════════════════════════════
s = prs.slides.add_slide(BL); bg_dark(s)
accent_bar(s, 0.8, 1.5, 1.5, C_CYAN)
txt(s, 0.8, 1.7, 11, 0.8, 'CLOUDSCALE', 42, True, C_WHITE)
txt(s, 0.8, 2.5, 11, 1.0,
    'High-Availability Auto-Scaling Cloud Infrastructure\n& Real-Time Telemetry Control Plane',
    20, True, C_CYAN)
txt(s, 0.8, 3.7, 10, 1.2, [
    'Zero-touch multi-AZ elastic architecture on Amazon Web Services (Sydney ap-southeast-2)',
    '100% declarative Terraform automation with hardware-driven CloudWatch Target Tracking',
    'Dual-portal containerized Node.js + React application serving 2 independent services'
], 13, False, C_MUTED)

for i, (label, color) in enumerate([
    ('AWS Multi-AZ', C_BLUE), ('Terraform IaC', C_PURPLE), ('Docker', C_CYAN),
    ('Target Tracking', C_AMBER), ('Defense-in-Depth', C_EMERALD), ('Self-Healing', C_ROSE)
]):
    pill(s, 0.8 + i * 2.0, 5.8, label, color)

txt(s, 0.8, 6.6, 11, 0.5, 'Mihir Nayka  |  Cloud Infrastructure Engineering  |  November 2026', 11, False, C_MUTED)


# ═════════════════════════════════════════════════════════════
# SLIDE 2: PROBLEM STATEMENT
# ═════════════════════════════════════════════════════════════
s = prs.slides.add_slide(BL); bg_light(s)
heading(s, 'Context & Motivation', 'The Cloud Scalability Problem',
        'Why traditional static hosting architectures fail modern enterprise demands')

problems = [
    ('Over-Provisioning', C_ROSE, 
     'Fixed infrastructure sized for peak traffic wastes 60-80% of cloud budget on idle resources. '
     'Monthly bills accumulate for unused compute, memory, and load balancer capacity with zero proportional performance benefit.'),
    ('Crash Under Traffic Surge', C_AMBER,
     'Under-provisioned servers experience CPU saturation, memory starvation, and 504 Gateway Timeouts during sudden spikes. '
     'Manual scaling via the AWS Console takes 15-30 minutes — far too slow to prevent user-facing outages.'),
    ('Security Exposure', C_BLUE,
     'Publicly exposed EC2 instances suffer continuous brute-force attacks, port scanning, and credential probing. '
     'Without security group chaining and private subnet isolation, the attack surface grows linearly with the fleet size.')
]
for i, (title, color, body) in enumerate(problems):
    cx = 0.8 + i * 4.0
    c = card(s, cx, 1.9, 3.7, 4.8)
    accent_bar(s, cx + 0.2, 2.1, 1.0, color)
    txt(s, cx + 0.2, 2.3, 3.3, 0.5, title, 15, True, color)
    txt(s, cx + 0.2, 3.0, 3.3, 3.5, body, 11, False, C_NAVY)


# ═════════════════════════════════════════════════════════════
# SLIDE 3: SOLUTION OVERVIEW — FOUR PILLARS
# ═════════════════════════════════════════════════════════════
s = prs.slides.add_slide(BL); bg_light(s)
heading(s, 'Architecture Strategy', 'The CloudScale Solution: Four Design Pillars',
        'Combining fault tolerance, automation, security isolation, and hardware-driven elasticity')

pillars = [
    ('Multi-AZ Fault Tolerance', C_EMERALD,
     'Instances spread across ap-southeast-2a and ap-southeast-2b. Full AZ failure causes automatic failover with zero downtime.'),
    ('Zero-Touch Terraform IaC', C_PURPLE,
     'VPC, subnets, NAT, ALB, ASG, IAM — all in declarative code. Single-command build (apply) or $0 teardown (destroy).'),
    ('Defense-in-Depth Security', C_BLUE,
     'Private subnets, chained security groups (alb-sg → ec2-sg), no public IPs on compute, IAM roles via IMDSv2.'),
    ('Hardware Auto-Scaling', C_AMBER,
     'CloudWatch 1-min hypervisor monitoring. CPU > 70% triggers scale-out. 15-min cooldown prevents flapping on scale-in.')
]
for i, (title, color, desc) in enumerate(pillars):
    row, col = i // 2, i % 2
    cx, cy = 0.8 + col * 6.1, 1.9 + row * 2.65
    c = card(s, cx, cy, 5.8, 2.4)
    accent_bar(s, cx + 0.2, cy + 0.2, 0.8, color)
    txt(s, cx + 0.2, cy + 0.4, 5.3, 0.5, title, 15, True, color)
    txt(s, cx + 0.2, cy + 1.0, 5.3, 1.3, desc, 12, False, C_NAVY)


# ═════════════════════════════════════════════════════════════
# SLIDE 4: FULL ARCHITECTURE DIAGRAM
# ═════════════════════════════════════════════════════════════
s = prs.slides.add_slide(BL); bg_light(s)
heading(s, 'System Design', 'Multi-AZ Infrastructure Architecture Diagram',
        'Complete topology: VPC, subnets, ALB, NAT Gateway, Auto Scaling Group, and security boundaries')
add_img(s, os.path.join(ASSETS, 'architecture_diagram.png'), 0.4, 1.5, 12.5)


# ═════════════════════════════════════════════════════════════
# SLIDE 5: REQUEST FLOW
# ═════════════════════════════════════════════════════════════
s = prs.slides.add_slide(BL); bg_light(s)
heading(s, 'Traffic Engineering', 'End-to-End HTTP Request Flow',
        'How a browser request traverses the architecture from internet entry to container response')
add_img(s, os.path.join(ASSETS, 'request_flow.png'), 0.3, 1.6, 12.7)

# Details below
txt(s, 0.8, 5.2, 5.5, 2.0, [
    '1. User hits ALB DNS on Port 80 (public) or 8080 (admin)',
    '2. ALB listener selects target group by port number',
    '3. Target group health check confirms node is healthy',
    '4. Chained security group verifies source is alb-sg',
    '5. Docker container serves React SPA + Express API'
], 10.5, False, C_NAVY)

txt(s, 7.0, 5.2, 5.5, 2.0, [
    'Session Stickiness: lb_cookie (3600s TTL) ensures telemetry polls the same node',
    'Health Check: GET /health every 15s with 2 consecutive failures = Unhealthy',
    'Connection Draining: 300s deregistration delay on scale-in events',
    'ALB distributes across AZs for geographic fault tolerance'
], 10.5, False, C_CARD)


# ═════════════════════════════════════════════════════════════
# SLIDE 6: SECURITY ARCHITECTURE
# ═════════════════════════════════════════════════════════════
s = prs.slides.add_slide(BL); bg_light(s)
heading(s, 'Security Architecture', 'Defense-in-Depth: Concentric Security Layers',
        'Four nested security boundaries ensuring zero unauthorized access to compute resources')
add_img(s, os.path.join(ASSETS, 'security_layers.png'), 0.8, 1.6, 11.7, 4.5)

txt(s, 0.8, 6.3, 11.7, 1.0, [
    'Key principle: EC2 instances have ZERO public IP addresses. All ingress flows exclusively through the ALB. '
    'IAM Instance Profile provides temporary STS tokens via IMDSv2 — no hardcoded AWS_ACCESS_KEY_ID in code or environment.'
], 10.5, False, C_CARD)


# ═════════════════════════════════════════════════════════════
# SLIDE 7: NETWORK & SUBNET TOPOLOGY
# ═════════════════════════════════════════════════════════════
s = prs.slides.add_slide(BL); bg_light(s)
heading(s, 'Network Engineering', 'VPC Subnet Allocation & Routing Architecture',
        'Custom 192.168.0.0/24 VPC divided into 4 /26 subnets across 2 Availability Zones')

# Subnet Table (left)
c = card(s, 0.8, 1.9, 6.0, 4.8)
subnets = [
    ('VPC Scope', '192.168.0.0/24', '256 IPs — Isolated virtual cloud network', C_NAVY),
    ('Public Subnet 1', '192.168.0.0/26 (AZ: 2a)', 'ALB Node A + NAT Gateway + Elastic IP', C_BLUE),
    ('Public Subnet 2', '192.168.0.64/26 (AZ: 2b)', 'ALB Node B (Multi-AZ redundancy)', C_BLUE),
    ('Private Subnet 1', '192.168.0.128/26 (AZ: 2a)', 'EC2 Node A — Route: 0.0.0.0/0 → NAT GW', C_EMERALD),
    ('Private Subnet 2', '192.168.0.192/26 (AZ: 2b)', 'EC2 Node B — Route: 0.0.0.0/0 → NAT GW', C_EMERALD),
]
ytop = 2.1
for name, cidr, desc, color in subnets:
    txt(s, 1.0, ytop, 5.5, 0.3, f'{name}: {cidr}', 11, True, color)
    txt(s, 1.0, ytop + 0.28, 5.5, 0.3, desc, 10, False, C_MUTED)
    ytop += 0.75

# Routing (right)
c = card(s, 7.1, 1.9, 5.5, 4.8)
txt(s, 7.3, 2.1, 5.0, 0.3, 'ROUTING ARCHITECTURE', 13, True, C_PURPLE)
routing = [
    ('Public Route Table', 'Destination 0.0.0.0/0 → Internet Gateway (igw).\nAssociations: pub_1, pub_2.'),
    ('Private Route Table', 'Destination 0.0.0.0/0 → NAT Gateway (nat-gw in pub_1).\nAssociations: priv_1, priv_2.'),
    ('NAT Gateway Purpose', 'Enables private EC2 nodes to run dnf update, git clone, docker pull\nwithout any public IP or inbound internet exposure.'),
    ('Dual-Listener ALB', 'Port 80 → tg-cloudscale-80 (Public Website)\nPort 8080 → tg-cloudscale-8080 (Admin Telemetry Cockpit)')
]
ytop = 2.6
for name, desc in routing:
    txt(s, 7.3, ytop, 5.0, 0.3, name, 11, True, C_NAVY)
    txt(s, 7.3, ytop + 0.28, 5.0, 0.6, desc, 9.5, False, C_CARD)
    ytop += 0.95


# ═════════════════════════════════════════════════════════════
# SLIDE 8: DUAL-PORTAL APPLICATION
# ═════════════════════════════════════════════════════════════
s = prs.slides.add_slide(BL); bg_light(s)
heading(s, 'Application Architecture', 'Dual-Portal Strategy: Public Website & Admin Telemetry',
        'Single Docker container serving two independent web services on separate ports')

# Port 80
c = card(s, 0.8, 1.9, 5.8, 5.0)
accent_bar(s, 1.0, 2.1, 1.0, C_BLUE)
txt(s, 1.0, 2.3, 5.4, 0.4, 'PORT 80: Public Cloud Portal', 15, True, C_BLUE)
txt(s, 1.0, 2.9, 5.4, 3.5, [
    'Audience: General public visitors and API consumers',
    'Technology: React 18 SPA built with Vite + Tailwind CSS',
    'Served as static files from /app/dist via Express',
    'Endpoints: /health, /info, /ping, /contact',
    'Hero section, feature showcase, contact form',
    'Fully responsive design across mobile and desktop'
], 11)

# Port 8080
c = card(s, 6.9, 1.9, 5.8, 5.0)
accent_bar(s, 7.1, 2.1, 1.0, C_PURPLE)
txt(s, 7.1, 2.3, 5.4, 0.4, 'PORT 8080: Operations Control Plane', 15, True, C_PURPLE)
txt(s, 7.1, 2.9, 5.4, 3.5, [
    'Audience: SRE, Cloud Architects, DevOps personnel',
    '7 Real-Time KPIs: Nodes, Healthy, CPU, RPM, Desired, Min, Max',
    'Live Recharts.js area charts for CPU & request telemetry',
    'Manual capacity controls: +1 / -1 instance buttons',
    'Real hardware CPU stress test trigger button',
    'Admin login with PIN verification and session lock'
], 11)


# ═════════════════════════════════════════════════════════════
# SLIDE 9: TECH STACK
# ═════════════════════════════════════════════════════════════
s = prs.slides.add_slide(BL); bg_light(s)
heading(s, 'Technology Stack', 'Complete Technology Integration & Coverage',
        'Full-stack cloud-native architecture combining 8 core technology domains')
add_img(s, os.path.join(ASSETS, 'chart_tech_stack.png'), 0.5, 1.6, 12.3)


# ═════════════════════════════════════════════════════════════
# SLIDE 10: AUTO-SCALING MECHANICS & TIMELINE
# ═════════════════════════════════════════════════════════════
s = prs.slides.add_slide(BL); bg_light(s)
heading(s, 'Elastic Compute', 'Auto-Scaling Timeline: CPU Response & Dynamic Instance Count',
        'Real-time visualization of Target Tracking scale-out and scale-in behavior')
add_img(s, os.path.join(ASSETS, 'chart_scaling_timeline.png'), 0.5, 1.5, 12.3)

# Key metrics below chart
metrics = [
    ('Target Metric', 'ASGAverageCPUUtilization', C_BLUE),
    ('Scale-Out Threshold', '> 70% for 3 min', C_ROSE),
    ('Scale-In Threshold', '< 49% for 15 min', C_EMERALD),
    ('Instance Warmup', '180 seconds', C_AMBER),
    ('Min / Max Capacity', '2 / 6 instances', C_PURPLE),
]
for i, (label, value, color) in enumerate(metrics):
    cx = 0.8 + i * 2.5
    pill_shape = card(s, cx, 6.3, 2.2, 0.8, C_WHITE)
    txt(s, cx + 0.1, 6.35, 2.0, 0.3, label, 9, True, color, PP_ALIGN.CENTER)
    txt(s, cx + 0.1, 6.65, 2.0, 0.3, value, 10, True, C_NAVY, PP_ALIGN.CENTER)


# ═════════════════════════════════════════════════════════════
# SLIDE 11: HARDWARE CPU STRESS ENGINE (BEFORE vs AFTER)
# ═════════════════════════════════════════════════════════════
s = prs.slides.add_slide(BL); bg_light(s)
heading(s, 'Engineering Innovation', 'Hardware CPU Stress Engine: Before vs After',
        'Bridging the simulation gap to trigger genuine AWS hypervisor-level scaling alarms')
add_img(s, os.path.join(ASSETS, 'chart_stress_comparison.png'), 0.5, 1.5, 12.3)

txt(s, 0.8, 5.5, 5.5, 1.5, [
    'BEFORE: Dashboard showed 78% CPU but physical EC2 was at 1.5%.',
    'AWS CloudWatch monitors the hypervisor, not Node.js variables.',
    'Result: Auto Scaling never triggered any scale-out event.'
], 10.5, False, C_ROSE)

txt(s, 7.0, 5.5, 5.5, 1.5, [
    'AFTER: worker_threads spawn multi-core SHA-256 crypto loops.',
    'Physical CPU measured at 88% across both EC2 vCPUs.',
    'CloudWatch AlarmHigh trips → ASG launches 3rd instance!'
], 10.5, False, C_EMERALD)


# ═════════════════════════════════════════════════════════════
# SLIDE 12: SCALE-IN TIMELINE
# ═════════════════════════════════════════════════════════════
s = prs.slides.add_slide(BL); bg_light(s)
heading(s, 'Scale-In Lifecycle', 'From Load Drop to Instance Termination: Exact Timeline',
        'Conservative 15-20 minute cooldown prevents costly instance thrashing (flapping)')
add_img(s, os.path.join(ASSETS, 'chart_scalein.png'), 0.5, 1.6, 12.3)

txt(s, 0.8, 4.5, 11.7, 2.5, [
    'Phase 1 — CloudWatch Alarm Evaluation (15 min): Requires 15 consecutive 1-minute datapoints below 49% CPU to confirm traffic has permanently subsided.',
    'Phase 2 — ALB Connection Draining (5 min): The ALB deregisters the target and drains in-flight requests. Active HTTP connections complete safely with zero 502/504 errors.',
    'Phase 3 — EC2 Termination (1-2 min): OS graceful shutdown (SIGTERM → SIGKILL), Docker container stops, instance enters terminated state.',
    '',
    'Manual "Decrease Capacity" button bypasses CloudWatch and terminates immediately in ~1-2 minutes via direct SetDesiredCapacityCommand.'
], 11)


# ═════════════════════════════════════════════════════════════
# SLIDE 13: TERRAFORM IaC & ZERO-TOUCH AUTOMATION
# ═════════════════════════════════════════════════════════════
s = prs.slides.add_slide(BL); bg_light(s)
heading(s, 'DevOps Automation', 'Zero-Touch Infrastructure as Code with Terraform',
        '100% declarative provisioning — no manual AWS Console clicks required')

tf_cards = [
    ('terraform apply', C_EMERALD, [
        'Creates entire VPC, 4 subnets, IGW, NAT GW, ALB, ASG, IAM',
        'Dynamically fetches latest Amazon Linux 2023 AMI',
        'Packages cloud-init user-data into Launch Template',
        'Deploys 2 baseline EC2 instances across Multi-AZ',
        'Total time: ~3-5 minutes to full production cluster'
    ]),
    ('terraform destroy', C_ROSE, [
        'Cleanly deletes ALL 25+ AWS resources in dependency order',
        'NAT GW, ALB, EC2 instances, EIPs all removed',
        'AWS billing drops to exactly $0.00 / hour',
        'State file preserved for identical rebuild anytime',
        'Total time: ~3-4 minutes to complete teardown'
    ]),
    ('terraform apply (Rebuild)', C_BLUE, [
        'Identical infrastructure recreated from same codebase',
        'New ALB DNS endpoint printed in terminal output',
        'Cloud-init auto: git clone → docker build → docker run',
        'Both websites operational within 3 minutes',
        '100% reproducible with zero manual intervention'
    ])
]
for i, (title, color, points) in enumerate(tf_cards):
    cx = 0.8 + i * 4.0
    c = card(s, cx, 1.9, 3.8, 5.0)
    accent_bar(s, cx + 0.2, 2.1, 0.8, color)
    txt(s, cx + 0.2, 2.3, 3.4, 0.4, title, 15, True, color)
    txt(s, cx + 0.2, 2.9, 3.4, 3.8, ['• ' + p for p in points], 10.5)


# ═════════════════════════════════════════════════════════════
# SLIDE 14: COST ANALYSIS
# ═════════════════════════════════════════════════════════════
s = prs.slides.add_slide(BL); bg_light(s)
heading(s, 'Financial Engineering', 'AWS Cost Analysis & Zero-Dollar Teardown Strategy',
        'Understanding operational burn rates and lifecycle cost optimization')
add_img(s, os.path.join(ASSETS, 'chart_cost.png'), 0.5, 1.5, 12.3)

txt(s, 0.8, 5.8, 11.7, 1.5, [
    'Recommendation: Run terraform destroy when not actively demonstrating. Run terraform apply to rebuild in <5 min.',
    'NAT Gateway is the largest fixed cost ($32.40/mo) — it charges hourly regardless of traffic volume.',
    'EC2 t3.micro instances may be covered under the AWS 12-month Free Tier (750 hrs/month).'
], 10.5, False, C_CARD)


# ═════════════════════════════════════════════════════════════
# SLIDE 15: CHAOS ENGINEERING & SELF-HEALING
# ═════════════════════════════════════════════════════════════
s = prs.slides.add_slide(BL)
bg_dark(s)
heading(s, 'Resilience Lab', 'Chaos Engineering: Proving Zero-Downtime Self-Healing',
        'Simulated catastrophic node failure validates automatic recovery', dark=True)

chaos_steps = [
    ('1. INJECT FAILURE', C_ROSE,
     'Terminate one of two active EC2 instances via AWS CLI or Console. '
     'This simulates a hardware crash, kernel panic, or AZ-level incident.'),
    ('2. DETECT (30s)', C_AMBER,
     'ALB health check fails 2 consecutive probes (15s interval). '
     'Target marked Unhealthy — traffic routing stops immediately.'),
    ('3. ZERO DOWNTIME', C_EMERALD,
     '100% of user traffic reroutes to the surviving instance. '
     'Zero 5xx errors, zero dropped packets — users are unaffected.'),
    ('4. SELF-HEAL', C_BLUE,
     'ASG detects cluster below min_size=2. Automatically launches '
     'a replacement node in the alternate AZ within 2-3 minutes.')
]
for i, (title, color, desc) in enumerate(chaos_steps):
    cx = 0.5 + i * 3.2
    c = card(s, cx, 2.0, 3.0, 4.5, C_BG2, color)
    accent_bar(s, cx + 0.2, 2.2, 0.6, color)
    txt(s, cx + 0.2, 2.4, 2.6, 0.4, title, 13, True, color)
    txt(s, cx + 0.2, 3.1, 2.6, 3.0, desc, 11, False, C_MUTED)


# ═════════════════════════════════════════════════════════════
# SLIDE 16: FUTURE ROADMAP
# ═════════════════════════════════════════════════════════════
s = prs.slides.add_slide(BL); bg_light(s)
heading(s, 'Future Scope', 'Production Enhancements & Enterprise Evolution Roadmap',
        'Architectural upgrades transforming the prototype into an enterprise-grade platform')

roadmap = [
    ('HTTPS with Route 53 + ACM', C_BLUE,
     'Free auto-renewing SSL/TLS certificates on Port 443 at the ALB. '
     'HTTP-to-HTTPS redirection. Custom domain integration.'),
    ('AWS ECS Fargate / EKS', C_PURPLE,
     'Migrate from raw EC2 VMs to serverless container tasks. '
     'Eliminate OS patching. Cold-start drops from 3 min to 30s.'),
    ('ElastiCache Redis + Aurora', C_AMBER,
     'Distributed session state via Redis. Persistent data in Aurora Serverless v2 (PostgreSQL). '
     'Enables true stateless compute scaling.'),
    ('AWS WAF + CloudFront CDN', C_ROSE,
     'Web Application Firewall for SQL injection, XSS, DDoS protection. '
     'CloudFront edge caching for global React SPA delivery.')
]
for i, (title, color, desc) in enumerate(roadmap):
    row, col = i // 2, i % 2
    cx, cy = 0.8 + col * 6.1, 1.9 + row * 2.65
    c = card(s, cx, cy, 5.8, 2.4)
    accent_bar(s, cx + 0.2, cy + 0.2, 0.8, color)
    txt(s, cx + 0.2, cy + 0.4, 5.3, 0.4, title, 14, True, color)
    txt(s, cx + 0.2, cy + 1.0, 5.3, 1.3, desc, 11.5)


# ═════════════════════════════════════════════════════════════
# SLIDE 17: CONCLUSION — AWS WELL-ARCHITECTED
# ═════════════════════════════════════════════════════════════
s = prs.slides.add_slide(BL)
bg_dark(s)
heading(s, 'Conclusion', 'AWS Well-Architected Framework Alignment',
        'CloudScale satisfies all five pillars of enterprise cloud design', dark=True)

waf = [
    ('Operational Excellence', C_EMERALD,
     '100% IaC with Terraform. Zero manual console clicks. Single-command deploy and teardown.'),
    ('Security', C_BLUE,
     'Private subnets, chained SGs (alb-sg → ec2-sg), IAM roles via IMDSv2, zero hardcoded keys.'),
    ('Reliability', C_PURPLE,
     'Multi-AZ distribution, ALB health checks, auto self-healing, zero-downtime chaos resilience.'),
    ('Performance Efficiency', C_AMBER,
     'Hardware Target Tracking auto-scaling (2→6 nodes). Real CPU stress engine for genuine CloudWatch alarms.'),
    ('Cost Optimization', C_ROSE,
     'Elastic scaling prevents idle waste. terraform destroy = instant $0.00 cost. Free Tier eligible compute.')
]
for i, (title, color, desc) in enumerate(waf):
    cy = 2.0 + i * 1.0
    c = card(s, 0.8, cy, 11.7, 0.85, C_BG2, color)
    txt(s, 1.0, cy + 0.1, 3.0, 0.4, title, 13, True, color)
    txt(s, 4.0, cy + 0.15, 8.2, 0.5, desc, 11, False, C_MUTED)

txt(s, 0.8, 7.0, 11.7, 0.4, 'Thank You  —  Questions?', 18, True, C_CYAN, PP_ALIGN.CENTER)


# ═════════════════════════════════════════════════════════════
# SAVE
# ═════════════════════════════════════════════════════════════
prs.save(OUTPUT)
print(f"\nPresentation saved to: {OUTPUT}")
print(f"Slides: {len(prs.slides)}")
