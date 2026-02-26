import { Linkedin } from 'lucide-react';

// TODO: Replace with actual team data
const team = [
  {
    name: 'Team Member 1',
    university: 'Columbia University',
    photo: '/team-1.jpg', // Replace with actual photo
    linkedin: 'https://linkedin.com/in/member1',
  },
  {
    name: 'Team Member 2',
    university: 'Columbia University',
    photo: '/team-2.jpg', // Replace with actual photo
    linkedin: 'https://linkedin.com/in/member2',
  },
];

export default function Team() {
  return (
    <section id="team" className="section-padding bg-surface">
      <div className="section-container">
        <h2 className="section-title">Meet The Team</h2>
        <p className="section-subtitle">
          Built with passion at the Columbia AI for Good Hackathon
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-8">
          {team.map((member) => (
            <div key={member.name} className="flex flex-col items-center">
              {/* Photo */}
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-primary/20 mb-4">
                <img
                  src={member.photo}
                  alt={member.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to placeholder
                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=FF6B6B&color=fff&size=128`;
                  }}
                />
              </div>

              {/* Name */}
              <h3 className="text-lg font-bold">{member.name}</h3>

              {/* University */}
              <p className="text-text-muted text-sm mb-3">{member.university}</p>

              {/* LinkedIn */}
              <a
                href={member.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary-hover transition-colors"
              >
                <Linkedin className="w-4 h-4" />
                <span>LinkedIn</span>
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
