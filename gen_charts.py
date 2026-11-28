"""
CloudScale — Professional Presentation Generator
Generates chart images with matplotlib and assembles a polished .pptx
"""
import os, math
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch
import numpy as np
from PIL import Image, ImageDraw, ImageFont

OUT_DIR = r"d:\PROJECTS\AwsCloudScal\_ppt_assets"
os.makedirs(OUT_DIR, exist_ok=True)

# ── Color Palette ──
NAVY   = '#0F172A'
SLATE  = '#1E293B'
CARD   = '#334155'
BLUE   = '#0284C7'
CYAN   = '#0EA5E9'
EMERALD= '#10B981'
AMBER  = '#F59E0B'
ROSE   = '#EF4444'
PURPLE = '#8B5CF6'
MUTED  = '#94A3B8'
WHITE  = '#FFFFFF'
LIGHT  = '#F8FAFC'

plt.rcParams.update({
    'font.family': 'sans-serif',
    'font.sans-serif': ['Segoe UI', 'Arial', 'Helvetica'],
    'axes.facecolor': LIGHT,
    'figure.facecolor': WHITE,
    'axes.edgecolor': '#E2E8F0',
    'text.color': NAVY,
    'axes.labelcolor': NAVY,
    'xtick.color': MUTED,
    'ytick.color': MUTED,
})


# ═══════════════════════════════════════════════════════════════
# CHART 1: Auto-Scaling Timeline (CPU & Instances over time)
# ═══════════════════════════════════════════════════════════════
def chart_scaling_timeline():
    fig, ax1 = plt.subplots(figsize=(11, 4.5))
    
    # Time in minutes
    t = np.arange(0, 25, 0.5)
    
    # CPU simulation: idle → stress → scale-out absorbs → stop → cooldown
    cpu = []
    for ti in t:
        if ti < 2:
            cpu.append(35 + np.random.uniform(-3, 3))
        elif ti < 3:
            cpu.append(35 + (88-35) * ((ti-2)/1.0) + np.random.uniform(-2, 2))
        elif ti < 5:
            cpu.append(88 + np.random.uniform(-3, 3))
        elif ti < 6:
            cpu.append(88 - (88-62) * ((ti-5)/1.0) + np.random.uniform(-2, 2))
        elif ti < 12:
            cpu.append(62 + np.random.uniform(-4, 4))
        elif ti < 13:
            cpu.append(62 - (62-35) * ((ti-12)/1.0) + np.random.uniform(-2, 2))
        else:
            cpu.append(35 + np.random.uniform(-3, 3))
    cpu = np.clip(cpu, 10, 98)
    
    # Instance count
    instances = []
    for ti in t:
        if ti < 5:
            instances.append(2)
        elif ti < 20:
            instances.append(3)
        else:
            instances.append(2)
    
    ax1.fill_between(t, cpu, alpha=0.15, color=ROSE)
    ax1.plot(t, cpu, color=ROSE, linewidth=2.5, label='Avg CPU Utilization (%)')
    ax1.axhline(y=70, color=AMBER, linewidth=1.5, linestyle='--', alpha=0.8, label='Scale-Out Threshold (70%)')
    ax1.axhline(y=49, color=EMERALD, linewidth=1.5, linestyle='--', alpha=0.8, label='Scale-In Threshold (49%)')
    ax1.set_ylabel('CPU Utilization (%)', fontsize=11, fontweight='bold')
    ax1.set_ylim(0, 105)
    ax1.set_xlabel('Time (minutes)', fontsize=11, fontweight='bold')
    
    ax2 = ax1.twinx()
    ax2.step(t, instances, where='post', color=BLUE, linewidth=3, alpha=0.7, label='EC2 Instances')
    ax2.fill_between(t, instances, step='post', alpha=0.08, color=BLUE)
    ax2.set_ylabel('Active EC2 Instances', fontsize=11, fontweight='bold', color=BLUE)
    ax2.set_ylim(0, 7)
    ax2.tick_params(axis='y', labelcolor=BLUE)
    
    # Annotations
    ax1.annotate('Load Test\nStarted', xy=(2, 88), xytext=(2, 98),
                fontsize=9, fontweight='bold', color=ROSE, ha='center',
                arrowprops=dict(arrowstyle='->', color=ROSE, lw=1.5))
    ax1.annotate('3rd Instance\nAbsorbs Load', xy=(5.5, 62), xytext=(7, 80),
                fontsize=9, fontweight='bold', color=BLUE, ha='center',
                arrowprops=dict(arrowstyle='->', color=BLUE, lw=1.5))
    ax1.annotate('Load Test\nStopped', xy=(12, 35), xytext=(12, 55),
                fontsize=9, fontweight='bold', color=EMERALD, ha='center',
                arrowprops=dict(arrowstyle='->', color=EMERALD, lw=1.5))
    ax1.annotate('Scale-In\n(15 min cooldown)', xy=(20, 35), xytext=(21, 55),
                fontsize=9, fontweight='bold', color=PURPLE, ha='center',
                arrowprops=dict(arrowstyle='->', color=PURPLE, lw=1.5))
    
    lines1, labels1 = ax1.get_legend_handles_labels()
    lines2, labels2 = ax2.get_legend_handles_labels()
    ax1.legend(lines1 + lines2, labels1 + labels2, loc='upper right', fontsize=9,
              framealpha=0.9, edgecolor='#E2E8F0')
    
    ax1.set_title('Auto-Scaling Timeline: CPU Utilization & Dynamic Instance Count', 
                  fontsize=14, fontweight='bold', pad=12)
    ax1.grid(True, alpha=0.3)
    fig.tight_layout()
    path = os.path.join(OUT_DIR, 'chart_scaling_timeline.png')
    fig.savefig(path, dpi=200, bbox_inches='tight')
    plt.close(fig)
    return path


# ═══════════════════════════════════════════════════════════════
# CHART 2: Cost Breakdown Donut Chart
# ═══════════════════════════════════════════════════════════════
def chart_cost_donut():
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(11, 4.5))
    
    # Running costs
    labels = ['NAT Gateway\n$32.40/mo', 'ALB\n$16.20/mo', 'EC2 (2x t3.micro)\n$15.00/mo', 'EBS Storage\n$3.20/mo']
    sizes = [32.40, 16.20, 15.00, 3.20]
    colors = [ROSE, PURPLE, BLUE, AMBER]
    explode = (0.05, 0.05, 0.05, 0.05)
    
    wedges, texts, autotexts = ax1.pie(sizes, explode=explode, labels=labels, autopct='%1.0f%%',
        colors=colors, startangle=90, pctdistance=0.75, textprops={'fontsize': 9})
    for at in autotexts:
        at.set_fontweight('bold')
        at.set_color(WHITE)
    
    centre_circle = plt.Circle((0, 0), 0.55, fc=WHITE)
    ax1.add_artist(centre_circle)
    ax1.text(0, 0.08, '$66.80', fontsize=18, fontweight='bold', ha='center', va='center', color=NAVY)
    ax1.text(0, -0.15, 'per month', fontsize=10, ha='center', va='center', color=MUTED)
    ax1.set_title('Monthly Running Cost Breakdown', fontsize=13, fontweight='bold', pad=12)
    
    # Comparison bar: Running vs Destroyed
    categories = ['Running\n(24/7)', 'Scale-to-Zero\n(ASG min=0)', 'Terraform\nDestroy']
    monthly = [66.80, 48.60, 0.00]
    bar_colors = [ROSE, AMBER, EMERALD]
    
    bars = ax2.bar(categories, monthly, color=bar_colors, width=0.5, edgecolor=WHITE, linewidth=2)
    for bar, val in zip(bars, monthly):
        ax2.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 1.5,
                f'${val:.2f}', ha='center', fontsize=12, fontweight='bold', color=NAVY)
    
    ax2.set_ylabel('Monthly Cost (USD)', fontsize=11, fontweight='bold')
    ax2.set_title('Cost Comparison: Teardown Strategy', fontsize=13, fontweight='bold', pad=12)
    ax2.set_ylim(0, 85)
    ax2.grid(axis='y', alpha=0.3)
    ax2.spines['top'].set_visible(False)
    ax2.spines['right'].set_visible(False)
    
    fig.tight_layout()
    path = os.path.join(OUT_DIR, 'chart_cost.png')
    fig.savefig(path, dpi=200, bbox_inches='tight')
    plt.close(fig)
    return path


# ═══════════════════════════════════════════════════════════════
# CHART 3: Scale-In Timeline Breakdown
# ═══════════════════════════════════════════════════════════════
def chart_scalein_timeline():
    fig, ax = plt.subplots(figsize=(11, 3.5))
    
    phases = [
        ('CloudWatch\nAlarm Evaluation', 15, BLUE),
        ('ALB Connection\nDraining', 5, PURPLE),
        ('EC2 Shutdown\n& Termination', 2, ROSE),
    ]
    
    left = 0
    for label, duration, color in phases:
        bar = ax.barh(0, duration, left=left, height=0.5, color=color, edgecolor=WHITE, linewidth=2)
        ax.text(left + duration/2, 0, f'{label}\n{duration} min', ha='center', va='center',
               fontsize=10, fontweight='bold', color=WHITE)
        left += duration
    
    ax.text(left + 0.5, 0, f'Total: ~{left} min', ha='left', va='center',
           fontsize=12, fontweight='bold', color=NAVY)
    
    ax.set_xlim(-0.5, 28)
    ax.set_yticks([])
    ax.set_xlabel('Time (minutes)', fontsize=11, fontweight='bold')
    ax.set_title('Scale-In Lifecycle: From Load Drop to Instance Termination', 
                fontsize=13, fontweight='bold', pad=12)
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.spines['left'].set_visible(False)
    ax.grid(axis='x', alpha=0.3)
    
    fig.tight_layout()
    path = os.path.join(OUT_DIR, 'chart_scalein.png')
    fig.savefig(path, dpi=200, bbox_inches='tight')
    plt.close(fig)
    return path


# ═══════════════════════════════════════════════════════════════
# DIAGRAM: Full Architecture (drawn with matplotlib)
# ═══════════════════════════════════════════════════════════════
def draw_architecture_diagram():
    fig, ax = plt.subplots(figsize=(13, 7.5))
    ax.set_xlim(0, 13)
    ax.set_ylim(0, 7.5)
    ax.axis('off')
    fig.patch.set_facecolor(LIGHT)
    
    def draw_box(x, y, w, h, label, color, fontsize=8, sublabel=None, alpha=1.0):
        box = FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.08",
                             facecolor=color, edgecolor=WHITE, linewidth=2, alpha=alpha)
        ax.add_patch(box)
        ax.text(x + w/2, y + h/2 + (0.08 if sublabel else 0), label,
               ha='center', va='center', fontsize=fontsize, fontweight='bold', color=WHITE)
        if sublabel:
            ax.text(x + w/2, y + h/2 - 0.15, sublabel,
                   ha='center', va='center', fontsize=6.5, color='#D1D5DB')
    
    def draw_region_box(x, y, w, h, label, color, fontcolor=NAVY):
        box = FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.1",
                             facecolor='none', edgecolor=color, linewidth=2.5, linestyle='--')
        ax.add_patch(box)
        ax.text(x + 0.15, y + h - 0.22, label, ha='left', va='center',
               fontsize=8, fontweight='bold', color=fontcolor,
               bbox=dict(boxstyle='round,pad=0.3', facecolor=WHITE, edgecolor=color, alpha=0.9))
    
    def draw_arrow(x1, y1, x2, y2, color=MUTED, style='->', lw=1.5):
        ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                   arrowprops=dict(arrowstyle=style, color=color, lw=lw))
    
    # Title
    ax.text(6.5, 7.2, 'CloudScale — Multi-AZ High-Availability Architecture', 
           ha='center', fontsize=16, fontweight='bold', color=NAVY)
    ax.text(6.5, 6.95, 'AWS Sydney Region (ap-southeast-2) | VPC: 192.168.0.0/24', 
           ha='center', fontsize=10, color=MUTED)
    
    # Users
    draw_box(0.3, 5.8, 1.6, 0.7, '🌐 Public Users', '#475569', 9, 'HTTP Port 80')
    draw_box(0.3, 4.8, 1.6, 0.7, '👨‍💻 Admin / SRE', '#475569', 9, 'HTTP Port 8080')
    
    # Internet Gateway
    draw_box(2.8, 5.2, 1.4, 0.8, 'Internet\nGateway', BLUE, 9)
    
    # ALB
    draw_box(5.0, 5.2, 2.0, 0.8, 'Application Load\nBalancer (ALB)', PURPLE, 9, 'Listeners: 80 & 8080')
    
    # Security Groups
    draw_box(5.0, 4.2, 2.0, 0.6, '🔒 ALB Security Group', ROSE, 8, 'Inbound: 0.0.0.0/0 → 80, 8080')
    
    # Target Groups
    draw_box(4.3, 3.2, 1.3, 0.6, 'Target Group\nPort 80', CYAN, 8)
    draw_box(6.0, 3.2, 1.3, 0.6, 'Target Group\nPort 8080', CYAN, 8)
    
    # EC2 SG
    draw_box(4.3, 2.4, 3.0, 0.5, '🔒 EC2 Security Group (src: alb-sg only)', ROSE, 7.5)
    
    # VPC Region
    draw_region_box(3.8, 0.15, 5.6, 2.1, 'Private Subnets (No Public IP)', EMERALD)
    
    # EC2 Instances
    draw_box(4.0, 0.5, 1.6, 1.3, 'EC2 Node A', EMERALD, 9, 'AZ: 2a | 192.168.0.147\nDocker: React + Express')
    draw_box(5.9, 0.5, 1.6, 1.3, 'EC2 Node B', EMERALD, 9, 'AZ: 2b | 192.168.0.215\nDocker: React + Express')
    draw_box(7.8, 0.5, 1.4, 1.3, 'EC2 Node C', AMBER, 9, '(Dynamic Scale-Out)\nSpawned by ASG', alpha=0.75)
    
    # NAT Gateway
    draw_box(10.0, 5.2, 1.4, 0.8, 'NAT\nGateway', '#0369A1', 9, 'EIP: 13.237.x.x')
    
    # Management Layer
    draw_region_box(9.5, 1.5, 3.3, 3.2, 'AWS Management & Monitoring', AMBER)
    
    draw_box(9.7, 3.5, 2.9, 0.7, 'CloudWatch Metrics', '#BE185D', 9, 'ASGAverageCPUUtilization (1-min)')
    draw_box(9.7, 2.5, 2.9, 0.7, 'Auto Scaling Group', '#C2410C', 9, 'Min: 2 | Desired: 2 | Max: 6')
    draw_box(9.7, 1.7, 2.9, 0.5, 'Launch Template + IAM Role', CARD, 8, 'AMI: Amazon Linux 2023 + cloud-init')
    
    # Arrows (request flow)
    draw_arrow(1.9, 6.15, 2.8, 5.7, BLUE, '->', 2)
    draw_arrow(1.9, 5.15, 2.8, 5.5, PURPLE, '->', 2)
    draw_arrow(4.2, 5.6, 5.0, 5.6, BLUE, '->', 2)
    draw_arrow(6.0, 5.2, 6.0, 4.8, ROSE, '->', 1.5)
    draw_arrow(5.3, 4.2, 5.0, 3.8, CYAN, '->', 1.5)
    draw_arrow(6.3, 4.2, 6.5, 3.8, CYAN, '->', 1.5)
    draw_arrow(5.0, 3.2, 4.8, 2.9, EMERALD, '->', 1.5)
    draw_arrow(6.6, 3.2, 6.6, 2.9, EMERALD, '->', 1.5)
    draw_arrow(5.8, 2.4, 4.8, 1.8, EMERALD, '->', 1.5)
    draw_arrow(5.8, 2.4, 6.7, 1.8, EMERALD, '->', 1.5)
    
    # Monitoring arrows
    draw_arrow(7.8, 1.2, 9.7, 3.8, '#BE185D', '->', 1.5)
    draw_arrow(11.1, 3.5, 11.1, 3.2, AMBER, '->', 1.5)
    draw_arrow(11.1, 2.5, 11.1, 2.2, CARD, '->', 1.5)
    draw_arrow(9.7, 2.8, 8.9, 1.2, AMBER, '->', 1.5)
    
    # Outbound
    draw_arrow(6.6, 1.8, 10.5, 5.2, '#0369A1', '->', 1)
    
    fig.tight_layout()
    path = os.path.join(OUT_DIR, 'architecture_diagram.png')
    fig.savefig(path, dpi=200, bbox_inches='tight')
    plt.close(fig)
    return path


# ═══════════════════════════════════════════════════════════════
# DIAGRAM: Request Flow (Step by Step)
# ═══════════════════════════════════════════════════════════════
def draw_request_flow():
    fig, ax = plt.subplots(figsize=(13, 4))
    ax.set_xlim(0, 13)
    ax.set_ylim(0, 4)
    ax.axis('off')
    fig.patch.set_facecolor(WHITE)
    
    steps = [
        ('1', 'User\nRequest', '#475569', 0.3),
        ('2', 'DNS\nResolution', BLUE, 2.1),
        ('3', 'Internet\nGateway', '#0369A1', 3.9),
        ('4', 'ALB\nListener', PURPLE, 5.7),
        ('5', 'Target\nGroup', CYAN, 7.5),
        ('6', 'Security\nGroup', ROSE, 9.3),
        ('7', 'Docker\nContainer', EMERALD, 11.1),
    ]
    
    for step_num, label, color, x in steps:
        box = FancyBboxPatch((x, 1.0), 1.5, 2.0, boxstyle="round,pad=0.12",
                             facecolor=color, edgecolor=WHITE, linewidth=2)
        ax.add_patch(box)
        ax.text(x + 0.75, 2.5, step_num, ha='center', va='center',
               fontsize=20, fontweight='bold', color=WHITE, alpha=0.3)
        ax.text(x + 0.75, 1.9, label, ha='center', va='center',
               fontsize=10, fontweight='bold', color=WHITE)
    
    # Connect arrows
    for i in range(len(steps) - 1):
        x1 = steps[i][3] + 1.5
        x2 = steps[i+1][3]
        ax.annotate('', xy=(x2, 2.0), xytext=(x1, 2.0),
                   arrowprops=dict(arrowstyle='->', color=NAVY, lw=2.5))
    
    # Sublabels
    sublabels = [
        'HTTP :80\nor :8080', 'ALB DNS\nendpoint', 'VPC\nIngress', 'Port-based\nRouting',
        'Health\nChecks', 'Chained\nFirewall', 'React SPA\n+ Express API'
    ]
    for i, (_, _, _, x) in enumerate(steps):
        ax.text(x + 0.75, 0.6, sublabels[i], ha='center', va='center',
               fontsize=7.5, color=MUTED, style='italic')
    
    ax.set_title('End-to-End HTTP Request Flow: From Browser to Application Container',
                fontsize=14, fontweight='bold', pad=12, color=NAVY)
    
    fig.tight_layout()
    path = os.path.join(OUT_DIR, 'request_flow.png')
    fig.savefig(path, dpi=200, bbox_inches='tight')
    plt.close(fig)
    return path


# ═══════════════════════════════════════════════════════════════
# CHART: Security Layer Diagram
# ═══════════════════════════════════════════════════════════════
def draw_security_layers():
    fig, ax = plt.subplots(figsize=(11, 5))
    ax.set_xlim(0, 11)
    ax.set_ylim(0, 5)
    ax.axis('off')
    fig.patch.set_facecolor(WHITE)
    
    layers = [
        (0.5, 0.3, 10.0, 4.2, 'Layer 1: Public Internet → ALB Security Group',
         'Ports 80 & 8080 open to 0.0.0.0/0 for public web traffic', BLUE, 0.08),
        (1.3, 0.6, 8.4, 3.2, 'Layer 2: ALB → EC2 Security Group (Chained)',
         'Inbound ONLY from alb-sg reference — zero direct internet access', PURPLE, 0.1),
        (2.1, 0.9, 6.8, 2.2, 'Layer 3: EC2 Private Subnet (No Public IP)',
         'Located in 192.168.0.128/26 & .192/26 — outbound via NAT Gateway only', EMERALD, 0.12),
        (3.0, 1.3, 5.0, 1.2, 'Layer 4: IAM Role + IMDSv2',
         'Zero hardcoded credentials — temporary rotating STS tokens', AMBER, 0.15),
    ]
    
    for x, y, w, h, label, desc, color, alpha in layers:
        box = FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.15",
                             facecolor=color, edgecolor=color, linewidth=2.5, alpha=alpha)
        ax.add_patch(box)
        border = FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.15",
                                facecolor='none', edgecolor=color, linewidth=2.5)
        ax.add_patch(border)
        ax.text(x + w/2, y + h - 0.25, label, ha='center', va='center',
               fontsize=10, fontweight='bold', color=color)
        ax.text(x + w/2, y + h - 0.55, desc, ha='center', va='center',
               fontsize=8, color=CARD)
    
    ax.set_title('Defense-in-Depth: Concentric Security Architecture',
                fontsize=14, fontweight='bold', pad=12, color=NAVY)
    
    fig.tight_layout()
    path = os.path.join(OUT_DIR, 'security_layers.png')
    fig.savefig(path, dpi=200, bbox_inches='tight')
    plt.close(fig)
    return path


# ═══════════════════════════════════════════════════════════════
# CHART: Tech Stack Comparison
# ═══════════════════════════════════════════════════════════════
def chart_tech_stack():
    fig, ax = plt.subplots(figsize=(11, 4))
    
    categories = ['Terraform\nIaC', 'Docker\nContainer', 'React\nSPA', 'Node.js\nExpress', 'AWS\nAuto Scaling', 'CloudWatch\nMetrics', 'ALB\nRouting', 'IAM\nSecurity']
    values = [95, 90, 85, 88, 92, 87, 90, 95]
    colors = [PURPLE, CYAN, BLUE, EMERALD, AMBER, '#BE185D', PURPLE, ROSE]
    
    bars = ax.barh(categories, values, color=colors, height=0.55, edgecolor=WHITE, linewidth=2)
    
    for bar, val in zip(bars, values):
        ax.text(val + 1, bar.get_y() + bar.get_height()/2,
               f'{val}%', va='center', fontsize=10, fontweight='bold', color=NAVY)
    
    ax.set_xlim(0, 110)
    ax.set_title('Technology Integration & Coverage Score', fontsize=14, fontweight='bold', pad=12)
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.grid(axis='x', alpha=0.3)
    ax.set_xlabel('Integration Coverage (%)', fontsize=11, fontweight='bold')
    
    fig.tight_layout()
    path = os.path.join(OUT_DIR, 'chart_tech_stack.png')
    fig.savefig(path, dpi=200, bbox_inches='tight')
    plt.close(fig)
    return path


# ═══════════════════════════════════════════════════════════════
# CHART: CPU Stress Engine Comparison (Before vs After)
# ═══════════════════════════════════════════════════════════════
def chart_stress_comparison():
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(11, 4))
    
    # Before: Simulated only
    t = np.arange(0, 10, 0.2)
    dashboard_cpu = [78 + np.random.uniform(-3, 3) if 2 < ti < 7 else 36 + np.random.uniform(-3, 3) for ti in t]
    real_cpu = [1.5 + np.random.uniform(-0.5, 0.5) for _ in t]
    
    ax1.plot(t, dashboard_cpu, color=AMBER, linewidth=2, label='Dashboard Display CPU')
    ax1.plot(t, real_cpu, color=ROSE, linewidth=2.5, label='Actual Hardware CPU')
    ax1.fill_between(t, real_cpu, alpha=0.2, color=ROSE)
    ax1.axhline(y=70, color=MUTED, linewidth=1, linestyle='--', alpha=0.5)
    ax1.set_title('❌ BEFORE: Software Simulation Only', fontsize=12, fontweight='bold', color=ROSE)
    ax1.set_ylabel('CPU %', fontweight='bold')
    ax1.set_xlabel('Time (min)', fontweight='bold')
    ax1.legend(fontsize=8, loc='upper right')
    ax1.set_ylim(0, 100)
    ax1.grid(alpha=0.3)
    ax1.text(5, 10, 'AWS sees 1.5% → NO scaling!', fontsize=9, fontweight='bold',
            color=ROSE, ha='center', style='italic')
    
    # After: Real hardware stress
    real_cpu2 = [88 + np.random.uniform(-4, 4) if 2 < ti < 7 else 1.5 + np.random.uniform(-0.5, 0.5) for ti in t]
    
    ax2.plot(t, real_cpu2, color=EMERALD, linewidth=2.5, label='Actual Hardware CPU')
    ax2.fill_between(t, real_cpu2, alpha=0.15, color=EMERALD)
    ax2.axhline(y=70, color=AMBER, linewidth=1.5, linestyle='--', alpha=0.8, label='Threshold 70%')
    ax2.set_title('✅ AFTER: Real Worker Thread Stress', fontsize=12, fontweight='bold', color=EMERALD)
    ax2.set_ylabel('CPU %', fontweight='bold')
    ax2.set_xlabel('Time (min)', fontweight='bold')
    ax2.legend(fontsize=8, loc='upper right')
    ax2.set_ylim(0, 100)
    ax2.grid(alpha=0.3)
    ax2.text(5, 10, 'AWS sees 88% → Auto-scales to 3!', fontsize=9, fontweight='bold',
            color=EMERALD, ha='center', style='italic')
    
    fig.suptitle('Hardware CPU Stress Engine: Before vs After', fontsize=14, fontweight='bold', y=1.02)
    fig.tight_layout()
    path = os.path.join(OUT_DIR, 'chart_stress_comparison.png')
    fig.savefig(path, dpi=200, bbox_inches='tight')
    plt.close(fig)
    return path


# ═══════════════════════════════════════════════════════════════
# GENERATE ALL ASSETS
# ═══════════════════════════════════════════════════════════════
print("Generating chart and diagram assets...")
img_arch     = draw_architecture_diagram()
img_reqflow  = draw_request_flow()
img_security = draw_security_layers()
img_timeline = chart_scaling_timeline()
img_cost     = chart_cost_donut()
img_scalein  = chart_scalein_timeline()
img_tech     = chart_tech_stack()
img_stress   = chart_stress_comparison()

print(f"Generated 8 assets in {OUT_DIR}")
for f in os.listdir(OUT_DIR):
    print(f"  ✓ {f}")
