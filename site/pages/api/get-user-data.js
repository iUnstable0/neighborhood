import { WebClient } from '@slack/web-api';
import Airtable from 'airtable';

// Initialize Airtable
const base = new Airtable({
  apiKey: process.env.AIRTABLE_API_KEY
}).base(process.env.AIRTABLE_BASE_ID);

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization');

  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    // First, get the user's email from Airtable using their token
    const userRecords = await base("neighbors")
      .select({
        filterByFormula: `{token} = '${token}'`,
        maxRecords: 1
      })
      .firstPage();

    if (userRecords.length === 0) {
      // If no user found, return a special status code to trigger logout
      return res.status(403).json({ 
        message: 'User not found',
        shouldLogout: true 
      });
    }

    const userRecord = userRecords[0];
    console.log('Raw Airtable user record:', {
      id: userRecord.id,
      fields: userRecord.fields
    });
    
    const userFields = userRecord.fields;
    const userId = userRecord.id;

    // Extract all relevant user data
    const userData = {
      email: userFields.email,
      name: userFields.name || '',
      profilePicture: userFields.profilePicture || '',
      githubUsername: userFields.githubUsername || '',
      birthday: userFields.birthday || '',
      hasProfilePic: !!userFields.profilePicture,
      // Add time-related fields
      totalTimeHackatimeHours: userFields.totalTimeHackatimeHours || 0,
      totalTimeStopwatchHours: userFields.totalTimeStopwatchHours || 0,
      totalTimeCombinedHours: userFields.totalTimeCombinedHours || 0,
      moveInDate: userFields['move-in-date'] || '',
      moveOutDate: userFields['move-out-date'] || '',
      gender: userFields['RoomGender'] || ''
    };

    // Get hackatime projects for this user
    const hackatimeProjects = await base("hackatimeProjects")
      .select({
        filterByFormula: `{email} = '${userData.email}'`,
        fields: ["name", "githubLink"],
      })
      .all();

    userData.hackatimeProjects = hackatimeProjects.map(record => ({
      id: record.id,
      ...record.fields
    }));

    // Get the user's Slack profile using the bot token
    const web = new WebClient(process.env.SLACK_BOT_TOKEN);
    
    let slack_id = null;
    let real_name = userData.name;
    let image_72 = userData.profilePicture;
    let display_name = userData.name;

    // Check if user already has Slack information in Airtable
    const existingSlackRecords = await base("#neighborhoodSlackMembers")
      .select({
        filterByFormula: `{Email} = '${userData.email}'`,
        maxRecords: 1
      })
      .firstPage();

    console.log('Found Slack records:', {
      count: existingSlackRecords.length,
      fields: existingSlackRecords[0]?.fields
    });

    if (existingSlackRecords.length > 0) {
      const slackRecord = existingSlackRecords[0].fields;
      slack_id = slackRecord['Slack ID'];
    }

    // If we have a Slack ID, use that to get fresh info from Slack
    if (slack_id) {
      console.log('Fetching Slack info using ID:', slack_id);
      try {
        const userInfo = await web.users.info({
          user: slack_id
        });
        if (userInfo.ok && userInfo.user) {
          const { profile, id } = userInfo.user;
          real_name = profile.real_name || real_name;
          image_72 = profile.image_72 || image_72;
          display_name = profile.display_name || display_name;

          console.log('Updated Slack info from ID:', {
            slack_id,
            display_name,
            real_name,
            has_image: !!image_72
          });

          // Update the Slack member record with fresh data
          if (existingSlackRecords.length > 0) {
            await base("#neighborhoodSlackMembers").update([{
              id: existingSlackRecords[0].id,
              fields: {
                'Email': userData.email,
                'Slack ID': slack_id,
                'Slack Handle': display_name,
                'Full Name': real_name,
                'Pfp': image_72 ? [{ url: image_72 }] : undefined,
                'neighbors': existingSlackRecords[0].fields.neighbors || [userId]
              }
            }]);
            console.log('Updated Slack member record with fresh data');
          }
        }
      } catch (error) {
        console.error('Error fetching Slack info by ID:', error);
      }
    } 
    // Only try email lookup if we don't have a Slack ID
    else {
      console.log('No Slack ID found, attempting email lookup');
      try {
        const users = await web.users.lookupByEmail({
          email: userData.email
        });
        if (users.ok && users.user) {
          const { profile, id } = users.user;
          slack_id = id;
          real_name = profile.real_name || real_name;
          image_72 = profile.image_72 || image_72;
          display_name = profile.display_name || display_name;

          console.log('Found Slack info by email:', {
            slack_id,
            display_name,
            real_name,
            has_image: !!image_72
          });
        }
      } catch (error) {
        if (error.data?.error === 'users_not_found') {
          console.log('User not found in Slack workspace');
        } else {
          console.error('Error looking up by email:', error);
        }
      }
    }

    // Now find and join the channel
    let channelList;
    try {
      console.log('Starting channel operations');
      
      // First, get the bot's own info
      const botInfo = await web.auth.test();
      console.log('Bot info retrieved:', { botId: botInfo.user_id });

      try {
        // Try to get channels using users.conversations
        const userChannels = await web.users.conversations({
          user: botInfo.user_id,
          types: 'public_channel,private_channel',
          exclude_archived: true,
          limit: 1000
        });

        // Also try the regular conversations.list
        const allChannels = await web.conversations.list({
          types: 'public_channel,private_channel',
          exclude_archived: true,
          limit: 1000
        });

        // Combine both lists
        channelList = {
          channels: [...new Set([...userChannels.channels, ...allChannels.channels])]
        };
      } catch (channelError) {
        console.error('Error fetching channels:', channelError);
        channelList = { channels: [] };
      }

      // Try different possible channel names
      const possibleNames = ['neighborhood', 'neighbourhood', 'neighborhoods', 'neighbourhoods'];
      let foundChannel = null;
      
      for (const name of possibleNames) {
        foundChannel = channelList.channels.find(channel => 
          channel.name.toLowerCase() === name.toLowerCase()
        );
        if (foundChannel) {
          console.log('Found matching channel:', foundChannel.name);
          break;
        }
      }

      if (foundChannel) {
        try {
          // First try to join the channel if we're not already a member
          if (!foundChannel.is_member) {
            console.log('Bot joining channel');
            await web.conversations.join({
              channel: foundChannel.id
            });
          }

          // Only try to invite the user if we have their slack_id
          if (slack_id) {
            try {
              console.log('Attempting to invite user to channel');
              await web.conversations.invite({
                channel: foundChannel.id,
                users: slack_id
              });
            } catch (inviteError) {
              console.log('Invite result:', inviteError.data?.error);
              if (inviteError.data?.error === 'user_is_restricted') {
                try {
                  // Get the channel link
                  const channelInfo = await web.conversations.info({
                    channel: foundChannel.id
                  });
                  
                  // Send DM to user
                  await web.chat.postMessage({
                    channel: slack_id,
                    text: `Welcome to the neighborhood! You can join our main channel here: ${channelInfo.channel.url}`
                  });
                } catch (dmError) {
                  console.error('Error sending DM:', dmError);
                }
              } else if (inviteError.data?.error === 'already_in_channel') {
                console.log('User already in channel');
              } else {
                console.error('Unknown invite error:', inviteError);
              }
            }
          }
        } catch (channelError) {
          console.error('Error in channel operations:', channelError);
        }
      }

      // Update or create record in #neighborhoodSlackMembers table
      try {
        console.log('Updating Slack member record');
        // Only proceed if we have at least the user ID and some meaningful data
        if (userId && (slack_id || display_name || real_name || image_72)) {
          // Check if a record already exists for this user
          const existingRecords = await base("#neighborhoodSlackMembers")
            .select({
              filterByFormula: `{Email} = '${userData.email}'`,
              maxRecords: 1
            })
            .firstPage();

          let record;
          if (existingRecords.length > 0) {
            // Get current neighbors to preserve them
            const currentNeighbors = existingRecords[0].fields.neighbors || [];
            
            // Update existing record
            record = await base("#neighborhoodSlackMembers").update([
              {
                id: existingRecords[0].id,
                fields: {
                  'Email': userData.email,
                  'Slack ID': slack_id,
                  'Slack Handle': display_name,
                  'Full Name': real_name,
                  'Pfp': image_72 ? [{ url: image_72 }] : undefined,
                  'neighbors': currentNeighbors.includes(userId) ? currentNeighbors : [...currentNeighbors, userId]
                }
              }
            ]);
            console.log('Updated existing Slack member record');
          } else {
            // Create new record
            record = await base("#neighborhoodSlackMembers").create([
              {
                fields: {
                  'Email': userData.email,
                  'Slack ID': slack_id,
                  'Slack Handle': display_name,
                  'Full Name': real_name,
                  'Pfp': image_72 ? [{ url: image_72 }] : undefined,
                  'neighbors': [userId]
                }
              }
            ]);
            console.log('Created new Slack member record');
          }
        }
      } catch (error) {
        console.error('Error updating Slack member record:', error);
      }

      console.log('Preparing final response');
      return res.status(200).json({
        id: userId,
        name: real_name,
        profilePicture: image_72,
        slackId: slack_id,
        slackHandle: display_name,
        email: userData.email,
        githubUsername: userData.githubUsername,
        birthday: userData.birthday,
        hasProfilePic: userData.hasProfilePic,
        hackatimeProjects: userData.hackatimeProjects,
        // Add time-related fields to response
        totalTimeHackatimeHours: userData.totalTimeHackatimeHours,
        totalTimeStopwatchHours: userData.totalTimeStopwatchHours,
        totalTimeCombinedHours: userData.totalTimeCombinedHours,
        moveInDate: userData.moveInDate,
        moveOutDate: userData.moveOutDate,
        gender: userData.gender
      });

    } catch (error) {
      console.error('Error in channel operations:', error);
      if (error.code === 'slack_webapi_platform_error' && error.data?.error === 'missing_scope') {
        return res.status(403).json({
          message: 'Missing required Slack scopes',
          error: 'The Slack app needs the following scopes: users:read.email, users:read, channels:read, channels:join, channels:manage, groups:read',
          shouldLogout: false
        });
      }
      
      // Instead of throwing, return what we have so far
      return res.status(200).json({
        id: userId,
        name: real_name,
        profilePicture: image_72,
        slackId: slack_id,
        slackHandle: display_name,
        email: userData.email,
        githubUsername: userData.githubUsername,
        birthday: userData.birthday,
        hasProfilePic: userData.hasProfilePic,
        hackatimeProjects: userData.hackatimeProjects,
        // Add time-related fields here too
        totalTimeHackatimeHours: userData.totalTimeHackatimeHours,
        totalTimeStopwatchHours: userData.totalTimeStopwatchHours,
        totalTimeCombinedHours: userData.totalTimeCombinedHours,
        moveInDate: userData.moveInDate,
        moveOutDate: userData.moveOutDate,
        gender: userData.gender
      });
    }

  } catch (error) {
    console.error('Fatal error in get-user-data:', error);
    return res.status(500).json({ 
      message: 'Error fetching user data',
      error: error.message 
    });
  }
}
